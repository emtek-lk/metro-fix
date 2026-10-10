import { Injectable, NotFoundException, BadRequestException, ConflictException, Optional } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkerEntity, ServiceRequestEntity, UserEntity } from '../entities';
import {
  Role,
  ServicePillar,
  JobStatus,
  isFinishedStatus,
  UpdateWorkerLocationDto,
  DEFAULT_APP_SETTINGS,
  passwordPolicyProblem,
} from '@metro-fix/core-types';

import { generateTemporaryPassword } from '../common/temp-password';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

/** A worker's own numbers, for the Profile screen. */
export interface WorkerStats {
  rating: number;
  completedJobs: number;
  /** Accepted jobs still being worked (ASSIGNED through IN_PROGRESS). */
  activeJobs: number;
  /** Jobs currently offered to this worker, awaiting their answer. */
  pendingOffers: number;
  servicePillars: ServicePillar[];
  isAvailable: boolean;
}

/**
 * A worker can be offered a job when they are on duty (their own switch in the mobile app) and
 * carry fewer than this many accepted, unfinished jobs. Override with MAX_ACTIVE_JOBS.
 */
export const DEFAULT_MAX_ACTIVE_JOBS = 5;

/** Statuses in which a job counts against its worker's workload. */
const OPEN_STATUSES = [
  JobStatus.PENDING_ACCEPTANCE,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
];

export type UnavailableReason = 'OFF_DUTY' | 'AT_CAPACITY' | 'DECLINED_THIS_JOB';

export interface DispatchSearchResult {
  worker: WorkerEntity;
  distanceMeters: number;
  distanceKm: number;
  dispatchScore: number;
  /** Accepted, unfinished jobs plus any offer awaiting an answer, counted live. */
  activeJobs: number;
  available: boolean;
  unavailableReason: UnavailableReason | null;
}

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @Optional() private readonly settings?: SettingsService,
  ) {}

  /** All workers, each with `liveActiveJobs`: accepted unfinished jobs plus open offers, counted now. */
  async findAll(): Promise<(WorkerEntity & { liveActiveJobs: number })[]> {
    const workers = await this.workerRepo.find({ relations: { user: true } });
    const open = await this.jobRepo.find({
      where: { status: In(OPEN_STATUSES) },
      select: { id: true, workerId: true },
    });
    const workload = new Map<string, number>();
    for (const { workerId } of open) {
      if (workerId) workload.set(workerId, (workload.get(workerId) ?? 0) + 1);
    }
    return workers.map((worker) => Object.assign(worker, { liveActiveJobs: workload.get(worker.id) ?? 0 }));
  }

  async findOne(id: string): Promise<WorkerEntity> {
    const worker = await this.workerRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID "${id}" not found`);
    }
    return worker;
  }

  /**
   * Creates the worker's login with a one-time password (the admin's own, or a generated one) and
   * flags it so the worker must choose their own at first sign-in. The password is returned once in
   * `temporaryPassword` and never stored in clear.
   */
  async createWorker(dto: CreateWorkerDto): Promise<WorkerEntity & { temporaryPassword: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException(`User with email "${dto.email}" already exists.`);
    }

    const minLength = (await this.settings?.get())?.security.passwordMinLength ?? DEFAULT_APP_SETTINGS.security.passwordMinLength;
    const temporaryPassword = dto.temporaryPassword?.trim() || generateTemporaryPassword(Math.max(10, minLength));
    const problem = passwordPolicyProblem(temporaryPassword, minLength);
    if (problem) throw new BadRequestException(problem);

    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber || undefined,
      role: Role.WORKER,
      password: temporaryPassword,
      mustChangePassword: true,
    });
    const savedUser = await this.userRepo.save(user);

    const pillars = dto.servicePillars && dto.servicePillars.length > 0
      ? dto.servicePillars
      : [ServicePillar.HARD];

    const worker = this.workerRepo.create({
      userId: savedUser.id,
      rating: 5.0,
      servicePillars: pillars,
      isAvailable: true,
      activeJobs: 0,
      latitude: 6.9271,
      longitude: 79.8612,
    });
    const savedWorker = await this.workerRepo.save(worker);
    savedWorker.user = savedUser;

    return Object.assign(savedWorker, { temporaryPassword });
  }

  async pingAllWorkers() {
    return {
      success: true,
      message: 'Broadcast ping sent to all active field units successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate distance between two lat/long points in kilometers using Haversine formula
   */
  private calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** Settings > Dispatch, unless MAX_ACTIVE_JOBS is set in the environment. */
  private async maxActiveJobs(): Promise<number> {
    const configured = Number(process.env.MAX_ACTIVE_JOBS);
    if (Number.isFinite(configured) && configured > 0) return configured;
    return (await this.appSettings()).dispatch.maxActiveJobs || DEFAULT_MAX_ACTIVE_JOBS;
  }

  private async appSettings() {
    return (await this.settings?.get()) ?? DEFAULT_APP_SETTINGS;
  }

  /**
   * Dispatch search: workers ranked by `rating * ratingWeight - distanceKm * proximityWeight` (Settings > Dispatch; nearer and better rated first).
   * Each result says whether the worker can take the job now. By default only available workers are
   * returned; `includeUnavailable` also returns off-duty, full and previously declined workers,
   * flagged with the reason, so dispatch can still override.
   */
  async getAvailableWorkersForJob(
    jobId: string,
    radiusMeters?: number,
    includeUnavailable: boolean = false,
  ): Promise<DispatchSearchResult[]> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Service request with ID "${jobId}" not found`);
    }

    const allWorkers = await this.workerRepo.find({ relations: { user: true } });
    const turnedDown = new Set(
      (job.offerHistory ?? [])
        .filter((entry) => entry.outcome === 'DECLINED' || entry.outcome === 'REJECTED')
        .map((entry) => entry.workerId),
    );

    // Live workload per worker: accepted unfinished jobs and open offers.
    const open = await this.jobRepo.find({
      where: { status: In(OPEN_STATUSES) },
      select: { id: true, workerId: true },
    });
    const workload = new Map<string, number>();
    for (const { workerId } of open) {
      if (workerId) workload.set(workerId, (workload.get(workerId) ?? 0) + 1);
    }

    const jobLat = job.latitude ?? 37.7749;
    const jobLon = job.longitude ?? -122.4194;
    const dispatch = (await this.appSettings()).dispatch;
    const cap = await this.maxActiveJobs();
    const radius = radiusMeters ?? dispatch.defaultRadiusKm * 1000;

    const results: DispatchSearchResult[] = allWorkers.map((worker) => {
      const wLat = worker.latitude ?? jobLat;
      const wLon = worker.longitude ?? jobLon;
      const distanceKm = this.calculateHaversineKm(jobLat, jobLon, wLat, wLon);
      const activeJobs = workload.get(worker.id) ?? 0;
      const unavailableReason: UnavailableReason | null = turnedDown.has(worker.id)
        ? 'DECLINED_THIS_JOB'
        : !worker.isAvailable
          ? 'OFF_DUTY'
          : activeJobs >= cap
            ? 'AT_CAPACITY'
            : null;

      return {
        worker,
        distanceMeters: Math.round(distanceKm * 1000),
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        dispatchScore: parseFloat((worker.rating * dispatch.ratingWeight - distanceKm * dispatch.proximityWeight).toFixed(2)),
        activeJobs,
        available: unavailableReason === null,
        unavailableReason,
      };
    });

    return results
      .filter((res) => includeUnavailable || res.available)
      .filter((res) => radius <= 0 || res.distanceMeters <= radius)
      .sort((a, b) => Number(b.available) - Number(a.available) || b.dispatchScore - a.dispatchScore);
  }

  /**
   * Admin edit of a worker: contact details (the email is their login, so it stays unique), the
   * internal rating dispatch ranks by, which services they cover, and whether they are on duty.
   */
  async updateWorker(id: string, dto: UpdateWorkerDto): Promise<WorkerEntity> {
    const worker = await this.findOne(id);

    if (dto.email !== undefined && dto.email !== worker.user.email) {
      const taken = await this.userRepo.findOne({ where: { email: dto.email } });
      if (taken && taken.id !== worker.user.id) {
        throw new ConflictException(`Another account already uses "${dto.email}".`);
      }
      worker.user.email = dto.email;
    }
    if (dto.fullName !== undefined) worker.user.fullName = dto.fullName;
    if (dto.phoneNumber !== undefined) worker.user.phoneNumber = dto.phoneNumber;
    await this.userRepo.save(worker.user);

    if (dto.rating !== undefined) worker.rating = dto.rating;
    if (dto.servicePillars !== undefined) worker.servicePillars = dto.servicePillars;
    if (dto.isAvailable !== undefined) worker.isAvailable = dto.isAvailable;
    await this.workerRepo.save(worker);
    return this.findOne(id);
  }

  /** A worker's own on-duty switch. Off-duty workers are not offered new jobs. */
  async setAvailability(userId: string, isAvailable: boolean): Promise<WorkerEntity> {
    const worker = await this.findWorkerForUser(userId);
    worker.isAvailable = isAvailable;
    return this.workerRepo.save(worker);
  }

  async findJobsForWorkerUser(userId: string) {
    const worker = await this.workerRepo.findOne({ where: { userId } });
    const targetWorkerId = worker ? worker.id : userId;

    // Only this worker's own jobs: accepted work plus any offer waiting for an answer.
    const jobs = await this.jobRepo.find({
      where: [{ workerId: targetWorkerId }, { workerId: userId }],
      relations: {
        customer: { user: true },
        worker: { user: true },
      },
      order: { createdAt: 'DESC' },
    });

    return {
      jobs,
      total: jobs.length,
    };
  }

  async findWorkerForUser(userId: string): Promise<WorkerEntity> {
    const worker = await this.workerRepo.findOne({ where: { userId }, relations: { user: true } });
    if (!worker) {
      throw new NotFoundException(`Worker profile for user ID "${userId}" not found`);
    }
    return worker;
  }

  /** Rating, completed and active job counts, pending offers and service pillars. */
  async getStatsForUser(userId: string): Promise<WorkerStats> {
    const worker = await this.findWorkerForUser(userId);
    const jobs = await this.jobRepo.find({ where: { workerId: worker.id }, select: { status: true } });

    let completedJobs = 0;
    let activeJobs = 0;
    let pendingOffers = 0;
    for (const { status } of jobs) {
      if (status === JobStatus.PENDING_ACCEPTANCE) pendingOffers += 1;
      else if (status === JobStatus.COMPLETED || status === JobStatus.CLOSED) completedJobs += 1;
      else if (!isFinishedStatus(status)) activeJobs += 1;
    }

    return {
      rating: worker.rating,
      completedJobs,
      activeJobs,
      pendingOffers,
      servicePillars: worker.servicePillars,
      isAvailable: worker.isAvailable,
    };
  }

  async updatePushToken(userId: string, pushToken: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    user.pushToken = pushToken;
    return this.userRepo.save(user);
  }

  async updateWorkerLocation(
    userId: string,
    dto: UpdateWorkerLocationDto,
  ): Promise<WorkerEntity> {
    const worker = await this.workerRepo.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!worker) {
      throw new NotFoundException(`Worker profile for user ID "${userId}" not found`);
    }

    worker.latitude = dto.latitude;
    worker.longitude = dto.longitude;
    if (dto.heading !== undefined) worker.heading = dto.heading;
    if (dto.speed !== undefined) worker.speed = dto.speed;

    return this.workerRepo.save(worker);
  }
}
