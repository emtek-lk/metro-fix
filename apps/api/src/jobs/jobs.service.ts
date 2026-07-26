import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobStatus } from '@metro-fix/core-types';
import { ServiceRequestEntity, WorkerEntity } from '../entities';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsGateway } from './jobs.gateway';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    private readonly jobsGateway: JobsGateway,
  ) {}

  async findAll(): Promise<ServiceRequestEntity[]> {
    return this.jobRepo.find({
      relations: {
        customer: { user: true },
        worker: { user: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ServiceRequestEntity> {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: {
        customer: { user: true },
        worker: { user: true },
      },
    });
    if (!job) {
      throw new NotFoundException(`Service request with ID "${id}" not found`);
    }
    return job;
  }

  /**
   * Creates a new service request job raised by Customer.
   * Emits 'job.created' event via WebSockets for real-time Kanban updates.
   */
  async createJob(dto: CreateJobDto): Promise<ServiceRequestEntity> {
    const job = this.jobRepo.create({
      title: dto.title,
      description: dto.description,
      servicePillar: dto.servicePillar,
      facilityType: dto.facilityType,
      status: JobStatus.REQUESTED,
      customerId: dto.customerId,
      workerId: null,
      location: {
        type: 'Point',
        coordinates: [dto.location.longitude, dto.location.latitude],
      },
    });

    const savedJob = await this.jobRepo.save(job);
    const fullJob = await this.findOne(savedJob.id);

    // Emit real-time WebSocket event
    this.jobsGateway.emitJobCreated(fullJob);

    return fullJob;
  }

  /**
   * Pipeline State Transition Business Logic:
   * 1. REQUESTED -> PENDING_ACCEPTANCE: Customer Care pings worker. Requires valid workerId.
   * 2. PENDING_ACCEPTANCE -> REQUESTED: Worker rejects/ignores. System nullifies workerId.
   * 3. Handles all 7-stage JobStatus lifecycle transitions.
   * Emits 'job.updated' event via WebSockets for real-time UI synchronization.
   */
  async updateJobStatus(
    id: string,
    dto: UpdateJobStatusDto,
  ): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);

    // Rule 1: Transitioning to PENDING_ACCEPTANCE requires workerId
    if (dto.status === JobStatus.PENDING_ACCEPTANCE) {
      const targetWorkerId = dto.workerId || job.workerId;
      if (!targetWorkerId) {
        throw new BadRequestException(
          'workerId is required when transitioning job status to PENDING_ACCEPTANCE',
        );
      }

      // Verify worker exists
      const workerExists = await this.workerRepo.exists({ where: { id: targetWorkerId } });
      if (!workerExists) {
        throw new NotFoundException(`Worker with ID "${targetWorkerId}" not found`);
      }

      job.workerId = targetWorkerId;
    }

    // Rule 2: Reverting to REQUESTED (e.g. Worker reject fallback) nullifies workerId
    if (dto.status === JobStatus.REQUESTED) {
      job.workerId = null;
    }

    // Update workerId if explicitly supplied for other statuses
    if (dto.workerId !== undefined && dto.status !== JobStatus.REQUESTED) {
      job.workerId = dto.workerId;
    }

    job.status = dto.status;
    const savedJob = await this.jobRepo.save(job);
    const updatedFull = await this.findOne(savedJob.id);

    // Emit real-time WebSocket event
    this.jobsGateway.emitJobUpdated(updatedFull);

    return updatedFull;
  }
}
