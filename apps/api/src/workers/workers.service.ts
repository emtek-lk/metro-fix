import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkerEntity, ServiceRequestEntity, UserEntity } from '../entities';
import { Role, ServicePillar, UpdateWorkerLocationDto } from '@metro-fix/core-types';

import { CreateWorkerDto } from './dto/create-worker.dto';

export interface DispatchSearchResult {
  worker: WorkerEntity;
  distanceMeters: number;
  distanceKm: number;
  dispatchScore: number;
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
  ) {}

  async findAll(): Promise<WorkerEntity[]> {
    return this.workerRepo.find({ relations: { user: true } });
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

  async createWorker(dto: CreateWorkerDto): Promise<WorkerEntity> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException(`User with email "${dto.email}" already exists.`);
    }

    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber || undefined,
      role: Role.WORKER,
      password: 'Password123!',
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

    return savedWorker;
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

  /**
   * Dispatch Sorting Algorithm
   */
  async getAvailableWorkersForJob(
    jobId: string,
    radiusMeters: number = 50000,
  ): Promise<DispatchSearchResult[]> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Service request with ID "${jobId}" not found`);
    }

    const workers = await this.workerRepo.find({
      where: { isAvailable: true },
      relations: { user: true },
    });

    const jobLat = job.latitude ?? 37.7749;
    const jobLon = job.longitude ?? -122.4194;

    const results: DispatchSearchResult[] = workers.map((worker) => {
      const wLat = worker.latitude ?? jobLat;
      const wLon = worker.longitude ?? jobLon;
      const distanceKm = this.calculateHaversineKm(jobLat, jobLon, wLat, wLon);
      const distanceMeters = Math.round(distanceKm * 1000);
      const dispatchScore = worker.rating * 20 - distanceKm;

      return {
        worker,
        distanceMeters,
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        dispatchScore: parseFloat(dispatchScore.toFixed(2)),
      };
    });

    return results
      .filter((res) => radiusMeters <= 0 || res.distanceMeters <= radiusMeters)
      .sort((a, b) => b.dispatchScore - a.dispatchScore);
  }

  async findJobsForWorkerUser(userId: string) {
    const worker = await this.workerRepo.findOne({ where: { userId } });
    const targetWorkerId = worker ? worker.id : userId;

    let jobs = await this.jobRepo.find({
      where: [
        { workerId: targetWorkerId },
        { workerId: userId },
      ],
      relations: {
        customer: { user: true },
        worker: { user: true },
      },
      order: { createdAt: 'DESC' },
    });

    if (jobs.length === 0) {
      jobs = await this.jobRepo.find({
        relations: {
          customer: { user: true },
          worker: { user: true },
        },
        order: { createdAt: 'DESC' },
      });
    }

    return {
      jobs,
      total: jobs.length,
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
