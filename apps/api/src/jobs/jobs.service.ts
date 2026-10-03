import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobStatus } from '@metro-fix/core-types';
import { ServiceRequestEntity, WorkerEntity, CustomerEntity } from '../entities';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { JobsGateway } from './jobs.gateway';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Allowed job lifecycle transitions (AGENTS.md section 4). Anything not listed is rejected.
 * PENDING_ACCEPTANCE -> REQUESTED is the worker reject / ignore auto-revert.
 */
const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.REQUESTED]: [JobStatus.PENDING_ACCEPTANCE, JobStatus.ASSIGNED],
  [JobStatus.PENDING_ACCEPTANCE]: [JobStatus.ASSIGNED, JobStatus.REQUESTED],
  [JobStatus.ASSIGNED]: [JobStatus.ON_ROUTE],
  [JobStatus.ON_ROUTE]: [JobStatus.INSPECTION],
  [JobStatus.INSPECTION]: [JobStatus.IN_PROGRESS],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
  [JobStatus.COMPLETED]: [],
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
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
    // The id column is a uniqueidentifier; a non-UUID would make SQL Server throw (HTTP 500).
    if (!UUID_PATTERN.test(id)) {
      throw new NotFoundException(`Service request with ID "${id}" not found`);
    }
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
    let targetCustomerId = dto.customerId;
    let customerExists = false;
    if (targetCustomerId) {
      const customer = await this.customerRepo.findOne({
        where: [{ id: targetCustomerId }, { userId: targetCustomerId }],
      });
      if (customer) {
        targetCustomerId = customer.id;
        customerExists = true;
      }
    }

    if (!customerExists) {
      const firstCustomer = await this.customerRepo.findOne({ where: {} });
      if (firstCustomer) {
        targetCustomerId = firstCustomer.id;
      }
    }

    const job = this.jobRepo.create({
      title: dto.title,
      description: dto.description,
      servicePillar: dto.servicePillar,
      facilityType: dto.facilityType,
      status: JobStatus.REQUESTED,
      customerId: targetCustomerId,
      workerId: null,
      latitude: dto.location?.latitude ?? 37.7749,
      longitude: dto.location?.longitude ?? -122.4194,
    });

    const savedJob = await this.jobRepo.save(job);
    const fullJob = await this.findOne(savedJob.id);

    // Emit real-time WebSocket event
    this.jobsGateway.emitJobCreated(fullJob);

    return fullJob;
  }

  private assertTransition(from: JobStatus, to: JobStatus): void {
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new ConflictException(`Invalid status transition: ${from} -> ${to}`);
    }
  }

  /** Resolves a worker by worker id or user id; throws 404 if none exists. */
  private async resolveWorker(workerIdOrUserId: string): Promise<WorkerEntity> {
    const worker = await this.workerRepo.findOne({
      where: [{ id: workerIdOrUserId }, { userId: workerIdOrUserId }],
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID "${workerIdOrUserId}" not found`);
    }
    return worker;
  }

  /**
   * Writes status / workerId with a direct UPDATE. Saving the loaded entity would let the
   * eagerly loaded `worker` relation override a changed or cleared `workerId` column.
   */
  private async applyStatus(
    id: string,
    status: JobStatus,
    workerId: string | null | undefined,
  ): Promise<ServiceRequestEntity> {
    const patch: { status: JobStatus; workerId?: string | null } = { status };
    if (workerId !== undefined) {
      patch.workerId = workerId;
    }
    await this.jobRepo.update({ id }, patch);
    const updatedFull = await this.findOne(id);
    this.jobsGateway.emitJobUpdated(updatedFull);
    return updatedFull;
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

    // Re-sending the current status is a harmless no-op (e.g. double tap).
    if (job.status === dto.status) {
      return job;
    }

    this.assertTransition(job.status, dto.status);

    let workerId: string | null | undefined;
    if (dto.status === JobStatus.REQUESTED) {
      workerId = null;
    } else if (dto.workerId) {
      workerId = (await this.resolveWorker(dto.workerId)).id;
    } else if (dto.status === JobStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException('A workerId is required to ping a worker.');
    }

    if (dto.status !== JobStatus.REQUESTED && workerId === undefined && !job.workerId) {
      throw new BadRequestException(`A worker must be assigned before moving to ${dto.status}.`);
    }

    return this.applyStatus(id, dto.status, workerId);
  }

  /**
   * Assigns a worker to a job ticket and transitions state to ASSIGNED.
   */
  async assignWorker(id: string, workerId: string): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    const worker = await this.resolveWorker(workerId);
    this.assertTransition(job.status, JobStatus.ASSIGNED);
    return this.applyStatus(id, JobStatus.ASSIGNED, worker.id);
  }

  /**
   * Submits a cost and labor quote for a job ticket and transitions state to IN_PROGRESS.
   */
  async submitJobQuote(
    id: string,
    dto: SubmitQuoteDto,
  ): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    this.assertTransition(job.status, JobStatus.IN_PROGRESS);

    await this.jobRepo.update(
      { id },
      {
        quoteAmount: dto.estimatedCost,
        estimatedHours: dto.estimatedHours,
        quoteNotes: dto.notes,
        status: JobStatus.IN_PROGRESS,
      },
    );
    const updatedFull = await this.findOne(id);
    this.jobsGateway.emitJobUpdated(updatedFull);
    return updatedFull;
  }

  /**
   * Submits signature and photo proof for a job ticket and transitions state to COMPLETED.
   */
  async submitJobProof(
    id: string,
    dto: SubmitProofDto,
  ): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    this.assertTransition(job.status, JobStatus.COMPLETED);

    await this.jobRepo.update(
      { id },
      {
        signature: dto.signature,
        photos: dto.photos,
        status: JobStatus.COMPLETED,
      },
    );
    const updatedFull = await this.findOne(id);
    this.jobsGateway.emitJobUpdated(updatedFull);
    return updatedFull;
  }
}
