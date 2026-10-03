import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobStatus } from '@metro-fix/core-types';
import { RejectJobDto } from './dto/reject-job.dto';
import { ServiceRequestEntity, WorkerEntity, CustomerEntity } from '../entities';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { JobsGateway } from './jobs.gateway';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Allowed job lifecycle transitions (AGENTS.md section 4). Anything not listed is rejected.
 * ASSIGNED / INSPECTION -> REQUESTED is the worker reject: the job bounces back to the dispatcher.
 */
const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.REQUESTED]: [JobStatus.ASSIGNED],
  [JobStatus.ASSIGNED]: [JobStatus.ON_ROUTE, JobStatus.REQUESTED],
  [JobStatus.ON_ROUTE]: [JobStatus.INSPECTION],
  [JobStatus.INSPECTION]: [JobStatus.IN_PROGRESS, JobStatus.REQUESTED],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
  [JobStatus.COMPLETED]: [JobStatus.CLOSED],
  [JobStatus.CLOSED]: [],
};

/** Default map centre (Colombo) used when a request arrives without coordinates. */
const DEFAULT_LATITUDE = 6.9271;
const DEFAULT_LONGITUDE = 79.8612;

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

  /** Jobs belonging to the customer profile of the given user id. */
  async findForCustomerUser(userId: string): Promise<ServiceRequestEntity[]> {
    const customer = await this.customerRepo.findOne({ where: { userId } });
    if (!customer) {
      return [];
    }
    return this.jobRepo.find({
      where: { customerId: customer.id },
      relations: { customer: { user: true }, worker: { user: true } },
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

    if (!customerExists && dto.customerId) {
      throw new BadRequestException('No customer profile found for this account.');
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
      latitude: dto.location?.latitude ?? DEFAULT_LATITUDE,
      longitude: dto.location?.longitude ?? DEFAULT_LONGITUDE,
      urgency: dto.urgency ?? 'MEDIUM',
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
   * 1. REQUESTED -> ASSIGNED: Customer Care assigns a worker. Requires valid workerId.
   * 2. ASSIGNED / INSPECTION -> REQUESTED: Worker rejects. System nullifies workerId.
   * 3. Handles all 7-stage JobStatus lifecycle transitions (plus COMPLETED -> CLOSED sign-off).
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

  /**
   * Worker declines a job (typically at INSPECTION when it is unserviceable or out of scope).
   * Clears the worker and returns the ticket to REQUESTED for the dispatcher to reassign.
   */
  async rejectJob(id: string, dto: RejectJobDto): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.ASSIGNED && job.status !== JobStatus.INSPECTION) {
      throw new ConflictException(`A job in ${job.status} cannot be rejected.`);
    }
    await this.jobRepo.update(
      { id },
      { status: JobStatus.REQUESTED, workerId: null, rejectReason: dto.reason },
    );
    const updatedFull = await this.findOne(id);
    this.jobsGateway.emitJobUpdated(updatedFull);
    return updatedFull;
  }

  /** Dispatcher / admin sign-off on a COMPLETED ticket (proof reviewed) -> CLOSED. */
  async closeJob(id: string): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    this.assertTransition(job.status, JobStatus.CLOSED);
    return this.applyStatus(id, JobStatus.CLOSED, undefined);
  }
}
