import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  JobStatus,
  Role,
  ServicePillar,
  FacilityType,
  OFFER_TIMEOUT_SECONDS,
  canTransition,
  type JobOfferOutcome,
  type JobOfferRecord,
  type JobCard,
  type JobCardSection,
  JOB_CARD_CURRENCY,
  SUBSCRIPTION_REQUIRED_CODE,
  computeJobCardTotals,
} from '@metro-fix/core-types';
import { RejectJobDto } from './dto/reject-job.dto';
import { CancelJobDto } from './dto/cancel-job.dto';
import { DeclineOfferDto } from './dto/decline-offer.dto';
import { ServiceRequestEntity, WorkerEntity, CustomerEntity } from '../entities';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';
import type { JobCardSectionInput } from './dto/job-card.dto';
import { randomUUID } from 'crypto';
import { JobsGateway } from './jobs.gateway';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Default map centre (Colombo) used when a request arrives without coordinates. */
const DEFAULT_LATITUDE = 6.9271;
const DEFAULT_LONGITUDE = 79.8612;

/** How often unanswered offers are swept back into the dispatch queue. */
const OFFER_SWEEP_INTERVAL_MS = 5_000;

/** The signed-in user performing an action. Staff are unrestricted; workers and customers are scoped. */
export interface Actor {
  id: string;
  role: Role;
}

const JOB_RELATIONS = {
  customer: { user: true },
  worker: { user: true },
} as const;

/**
 * Job lifecycle rules live in `@metro-fix/core-types` (JOB_TRANSITIONS) so the API, the dispatch
 * board and the mobile apps all agree. This service enforces them and owns everything that has
 * side effects: offers and their timeout, ownership checks, history, and real-time events.
 */
@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private offerSweepTimer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    private readonly jobsGateway: JobsGateway,
  ) {}

  // ── Offer timeout ─────────────────────────────────────────────────────────

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.offerSweepTimer = setInterval(() => {
      this.expireStaleOffers().catch((error) =>
        this.logger.warn(`Offer sweep failed: ${error?.message ?? error}`),
      );
    }, OFFER_SWEEP_INTERVAL_MS);
    this.offerSweepTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.offerSweepTimer) clearInterval(this.offerSweepTimer);
  }

  /** Seconds a worker has to answer an offer (overridable with OFFER_TIMEOUT_SECONDS). */
  get offerTimeoutSeconds(): number {
    const configured = Number(process.env.OFFER_TIMEOUT_SECONDS);
    return Number.isFinite(configured) && configured > 0 ? configured : OFFER_TIMEOUT_SECONDS;
  }

  /** Returns every offer that has gone unanswered past its deadline to the dispatch queue. */
  async expireStaleOffers(now: Date = new Date()): Promise<number> {
    const stale = await this.jobRepo.find({
      where: { status: JobStatus.PENDING_ACCEPTANCE, offerExpiresAt: LessThanOrEqual(now) },
      relations: JOB_RELATIONS,
    });
    for (const job of stale) {
      await this.releaseOffer(job, 'EXPIRED');
    }
    return stale.length;
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  async findAll(): Promise<ServiceRequestEntity[]> {
    return this.jobRepo.find({
      relations: JOB_RELATIONS,
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
      relations: JOB_RELATIONS,
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
      relations: JOB_RELATIONS,
    });
    if (!job) {
      throw new NotFoundException(`Service request with ID "${id}" not found`);
    }
    return job;
  }

  /** A job for the actor to read: customers see their own, workers only jobs that are theirs. */
  async findOneFor(id: string, actor: Actor): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    if (actor.role === Role.CUSTOMER && job.customer?.userId !== actor.id) {
      throw new ForbiddenException('You do not have access to this request.');
    }
    if (actor.role === Role.WORKER) {
      await this.assertWorkerOwns(job, actor);
    }
    return job;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * Creates a new service request job raised by Customer.
   * Emits 'job.created' event via WebSockets for real-time Kanban updates.
   */
  async createJob(
    dto: CreateJobDto,
    options: { requireSubscription?: boolean } = {},
  ): Promise<ServiceRequestEntity> {
    let targetCustomerId = dto.customerId;
    let customerExists = false;
    if (targetCustomerId) {
      const customer = await this.customerRepo.findOne({
        where: [{ id: targetCustomerId }, { userId: targetCustomerId }],
      });
      if (customer) {
        targetCustomerId = customer.id;
        customerExists = true;
        // Customers raising their own request need a paid plan; dispatch can raise one for anyone.
        if (options.requireSubscription && !customer.subscriptionTier) {
          throw new HttpException(
            {
              statusCode: HttpStatus.PAYMENT_REQUIRED,
              code: SUBSCRIPTION_REQUIRED_CODE,
              message: 'Choose a subscription plan to raise service requests.',
            },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }
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

    this.jobsGateway.emitJobCreated(fullJob);

    return fullJob;
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  private assertTransition(from: JobStatus, to: JobStatus): void {
    if (!canTransition(from, to)) {
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

  /** Workers may only act on a job that is currently with them. Staff are unrestricted. */
  private async assertWorkerOwns(job: ServiceRequestEntity, actor?: Actor): Promise<void> {
    if (!actor || actor.role !== Role.WORKER) return;
    const worker = await this.workerRepo.findOne({ where: { userId: actor.id } });
    if (!worker || !job.workerId || job.workerId !== worker.id) {
      throw new ForbiddenException('This job is not assigned to you.');
    }
  }

  private history(
    job: ServiceRequestEntity,
    entry: { workerId: string; outcome: JobOfferOutcome; reason?: string | null },
  ): JobOfferRecord[] {
    return [
      ...(job.offerHistory ?? []),
      { workerId: entry.workerId, outcome: entry.outcome, reason: entry.reason ?? null, at: new Date().toISOString() },
    ];
  }

  /**
   * Applies a change with a direct UPDATE (saving the loaded entity would let the eagerly loaded
   * `worker` relation override a changed or cleared `workerId`), then broadcasts the new state.
   * With `expected`, the update only applies if the job is still in that status, so two people
   * acting at once (a worker accepting as the offer expires) cannot both win.
   */
  private async commit(
    id: string,
    patch: Partial<ServiceRequestEntity>,
    options: { expected?: JobStatus; alsoNotifyUserIds?: string[] } = {},
  ): Promise<ServiceRequestEntity> {
    const criteria = options.expected ? { id, status: options.expected } : { id };
    const result = await this.jobRepo.update(criteria, patch as never);
    if (options.expected && result && result.affected === 0) {
      throw new ConflictException('This job was just updated by someone else. Please refresh.');
    }
    const updated = await this.findOne(id);
    this.jobsGateway.emitJobUpdated(updated, options.alsoNotifyUserIds ?? []);
    return updated;
  }

  // ── Offers (REQUESTED -> PENDING_ACCEPTANCE -> ASSIGNED) ──────────────────

  /**
   * Dispatch offers a job to one worker. They have `offerTimeoutSeconds` to accept; otherwise the
   * job returns to REQUESTED. A worker who already declined or rejected this job cannot be offered
   * it again.
   */
  async offerWorker(id: string, workerId: string): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    this.assertTransition(job.status, JobStatus.PENDING_ACCEPTANCE);
    const worker = await this.resolveWorker(workerId);

    const alreadyAnswered = (job.offerHistory ?? []).some(
      (entry) =>
        entry.workerId === worker.id && (entry.outcome === 'DECLINED' || entry.outcome === 'REJECTED'),
    );
    if (alreadyAnswered) {
      throw new ConflictException('This worker already turned this job down. Choose someone else.');
    }

    const now = new Date();
    const updated = await this.commit(
      id,
      {
        status: JobStatus.PENDING_ACCEPTANCE,
        workerId: worker.id,
        offeredAt: now,
        offerExpiresAt: new Date(now.getTime() + this.offerTimeoutSeconds * 1000),
      },
      { expected: JobStatus.REQUESTED },
    );
    this.jobsGateway.emitJobOffered(updated);
    return updated;
  }

  /** The offered worker accepts: PENDING_ACCEPTANCE -> ASSIGNED. */
  async acceptOffer(id: string, actor: Actor): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    this.assertTransition(job.status, JobStatus.ASSIGNED);
    await this.assertWorkerOwns(job, actor);

    if (job.offerExpiresAt && new Date(job.offerExpiresAt).getTime() <= Date.now()) {
      await this.releaseOffer(job, 'EXPIRED');
      throw new ConflictException('This offer has expired and went back to dispatch.');
    }

    return this.commit(
      id,
      { status: JobStatus.ASSIGNED, offerExpiresAt: null },
      { expected: JobStatus.PENDING_ACCEPTANCE },
    );
  }

  /** The offered worker declines: back to REQUESTED, remembered so they are not offered it again. */
  async declineOffer(id: string, dto: DeclineOfferDto, actor: Actor): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.PENDING_ACCEPTANCE) {
      throw new ConflictException(`There is no pending offer on a job in ${job.status}.`);
    }
    await this.assertWorkerOwns(job, actor);
    return this.releaseOffer(job, 'DECLINED', dto.reason);
  }

  /** Sends a pending offer back to the dispatch queue (declined, expired or withdrawn). */
  private async releaseOffer(
    job: ServiceRequestEntity,
    outcome: Extract<JobOfferOutcome, 'DECLINED' | 'EXPIRED' | 'WITHDRAWN'>,
    reason?: string | null,
  ): Promise<ServiceRequestEntity> {
    const previousWorkerUserId = job.worker?.userId;
    return this.commit(
      job.id,
      {
        status: JobStatus.REQUESTED,
        workerId: null,
        offeredAt: null,
        offerExpiresAt: null,
        rejectReason: outcome === 'DECLINED' ? reason ?? null : job.rejectReason ?? null,
        offerHistory: job.workerId
          ? this.history(job, { workerId: job.workerId, outcome, reason })
          : job.offerHistory ?? null,
      },
      {
        expected: JobStatus.PENDING_ACCEPTANCE,
        alsoNotifyUserIds: previousWorkerUserId ? [previousWorkerUserId] : [],
      },
    );
  }

  /** Kept for existing callers: assigning from dispatch now makes an offer. */
  async assignWorker(id: string, workerId: string): Promise<ServiceRequestEntity> {
    return this.offerWorker(id, workerId);
  }

  // ── Status changes ────────────────────────────────────────────────────────

  /**
   * Generic status change used by the dispatch board (drag and drop) and by workers moving through
   * the field stages. The lifecycle table decides what is legal; anything with side effects is
   * routed to its dedicated method so the rules live in one place.
   */
  async updateJobStatus(
    id: string,
    dto: UpdateJobStatusDto,
    actor?: Actor,
  ): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);

    // Re-sending the current status is a harmless no-op (e.g. double tap).
    if (job.status === dto.status) {
      return job;
    }

    // Workers move a job along the field stages only. Accept, decline, quote, proof and reject have
    // their own endpoints; assigning and closing are dispatch's call.
    if (actor?.role === Role.WORKER) {
      if (dto.status !== JobStatus.ON_ROUTE && dto.status !== JobStatus.INSPECTION) {
        throw new ForbiddenException('Workers can only start travel and arrive on site here.');
      }
      await this.assertWorkerOwns(job, actor);
    }

    this.assertTransition(job.status, dto.status);

    switch (dto.status) {
      case JobStatus.PENDING_ACCEPTANCE:
        if (!dto.workerId) {
          throw new BadRequestException('A workerId is required to offer a job.');
        }
        return this.offerWorker(id, dto.workerId);

      case JobStatus.CANCELLED:
        return this.cancelJob(id, {}, actor);

      case JobStatus.REQUESTED:
        // Pulled back to the queue by dispatch.
        if (job.status === JobStatus.PENDING_ACCEPTANCE) {
          return this.releaseOffer(job, 'WITHDRAWN');
        }
        return this.returnToQueue(job, 'WITHDRAWN');

      default:
        if (!job.workerId) {
          throw new BadRequestException(`A worker must be assigned before moving to ${dto.status}.`);
        }
        return this.commit(
          id,
          { status: dto.status, ...(dto.status === JobStatus.ASSIGNED ? { offerExpiresAt: null } : {}) },
          { expected: job.status },
        );
    }
  }

  /** Takes an accepted job back from its worker and returns it to the dispatch queue. */
  private async returnToQueue(
    job: ServiceRequestEntity,
    outcome: Extract<JobOfferOutcome, 'REJECTED' | 'WITHDRAWN'>,
    reason?: string | null,
  ): Promise<ServiceRequestEntity> {
    const previousWorkerUserId = job.worker?.userId;
    return this.commit(
      job.id,
      {
        status: JobStatus.REQUESTED,
        workerId: null,
        offeredAt: null,
        offerExpiresAt: null,
        rejectReason: outcome === 'REJECTED' ? reason ?? null : job.rejectReason ?? null,
        offerHistory: job.workerId
          ? this.history(job, { workerId: job.workerId, outcome, reason })
          : job.offerHistory ?? null,
      },
      { expected: job.status, alsoNotifyUserIds: previousWorkerUserId ? [previousWorkerUserId] : [] },
    );
  }

  /**
   * Turns client input into a priced card section. Totals are always computed here, never taken
   * from the client, so the card can be trusted for invoicing.
   */
  private buildCardSection(input: JobCardSectionInput, taxRate: number, savedBy?: string | null): JobCardSection {
    const lineItems = input.lineItems.map((item) => ({
      id: item.id || randomUUID(),
      kind: item.kind,
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
    return {
      lineItems,
      hours: input.hours,
      notes: input.notes ?? '',
      ...computeJobCardTotals(lineItems, taxRate),
      savedAt: new Date().toISOString(),
      savedBy: savedBy ?? null,
    };
  }

  /**
   * Submits the inspection quote as a job card (itemised lines, time, notes) and moves the job to
   * IN_PROGRESS. The flat cost / hours form is still accepted and becomes one line.
   */
  async submitJobQuote(
    id: string,
    dto: SubmitQuoteDto,
    actor?: Actor,
  ): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    await this.assertWorkerOwns(job, actor);
    this.assertTransition(job.status, JobStatus.IN_PROGRESS);

    const taxRate = dto.taxRate ?? job.jobCard?.taxRate ?? 0;
    const input: JobCardSectionInput = dto.lineItems
      ? {
          lineItems: dto.lineItems,
          hours:
            dto.estimatedHours ??
            dto.lineItems.filter((line) => line.kind === 'LABOUR').reduce((sum, line) => sum + line.quantity, 0),
          notes: dto.notes ?? '',
        }
      : {
          lineItems: [
            { kind: 'OTHER', description: 'Estimated work', quantity: 1, unitPrice: dto.estimatedCost ?? 0 },
          ],
          hours: dto.estimatedHours ?? 0,
          notes: dto.notes ?? '',
        };
    const estimate = this.buildCardSection(input, taxRate, actor?.id);
    const jobCard: JobCard = { currency: JOB_CARD_CURRENCY, taxRate, estimate, final: null };

    return this.commit(
      id,
      {
        jobCard,
        quoteAmount: estimate.total,
        estimatedHours: estimate.hours,
        quoteNotes: estimate.notes,
        status: JobStatus.IN_PROGRESS,
      },
      { expected: job.status },
    );
  }

  /**
   * Submits signature and photo proof and moves the job to COMPLETED. If the worker confirmed or
   * corrected the job card, that becomes the final section the invoice is based on.
   */
  async submitJobProof(
    id: string,
    dto: SubmitProofDto,
    actor?: Actor,
  ): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    await this.assertWorkerOwns(job, actor);
    this.assertTransition(job.status, JobStatus.COMPLETED);

    const patch: Partial<ServiceRequestEntity> = {
      signature: dto.signature,
      photos: dto.photos,
      status: JobStatus.COMPLETED,
    };
    if (dto.finalCard) {
      patch.jobCard = this.withFinal(job.jobCard, dto.finalCard, actor?.id);
    }

    return this.commit(id, patch, { expected: job.status });
  }

  private withFinal(existing: JobCard | null | undefined, input: JobCardSectionInput, savedBy?: string | null): JobCard {
    const taxRate = input.taxRate ?? existing?.taxRate ?? 0;
    const final = this.buildCardSection(input, taxRate, savedBy);
    // A job quoted before job cards existed has no estimate; the final stands in for it.
    return {
      currency: existing?.currency ?? JOB_CARD_CURRENCY,
      taxRate,
      estimate: existing?.estimate ?? final,
      final,
    };
  }

  /**
   * Dispatch corrects the final job card (hours or items changed on site, a price was wrong)
   * before the ticket is closed and billed. Closed tickets are locked.
   */
  async updateFinalCard(id: string, input: JobCardSectionInput, actor: Actor): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.IN_PROGRESS && job.status !== JobStatus.COMPLETED) {
      throw new ConflictException(
        job.status === JobStatus.CLOSED
          ? 'This ticket is closed, so its job card is locked.'
          : `The job card can be edited once work is in progress; this job is ${job.status}.`,
      );
    }
    return this.commit(id, { jobCard: this.withFinal(job.jobCard, input, actor.id) }, { expected: job.status });
  }

  /**
   * A worker who already accepted hands the job back (typically at INSPECTION when it is
   * unserviceable or out of scope). The worker is cleared and remembered, and the ticket returns to
   * REQUESTED for the dispatcher to reassign.
   */
  async rejectJob(id: string, dto: RejectJobDto, actor?: Actor): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.ASSIGNED && job.status !== JobStatus.INSPECTION) {
      throw new ConflictException(`A job in ${job.status} cannot be rejected.`);
    }
    await this.assertWorkerOwns(job, actor);
    return this.returnToQueue(job, 'REJECTED', dto.reason);
  }

  /** Dispatcher / admin sign-off on a COMPLETED ticket (proof reviewed) -> CLOSED. */
  async closeJob(id: string): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    this.assertTransition(job.status, JobStatus.CLOSED);
    return this.commit(id, { status: JobStatus.CLOSED, closedAt: new Date() }, { expected: job.status });
  }

  /**
   * Cancels a job that has not started work. Customers can cancel their own requests; dispatch can
   * cancel any. The worker, if there is one, is told so their screen clears.
   */
  async cancelJob(id: string, dto: CancelJobDto, actor?: Actor): Promise<ServiceRequestEntity> {
    const job = await this.findOne(id);
    if (actor?.role === Role.CUSTOMER && job.customer?.userId !== actor.id) {
      throw new ForbiddenException('You do not have access to this request.');
    }
    if (!canTransition(job.status, JobStatus.CANCELLED)) {
      throw new ConflictException(
        job.status === JobStatus.CANCELLED
          ? 'This request is already cancelled.'
          : `A job in ${job.status} can no longer be cancelled.`,
      );
    }

    const workerUserId = job.worker?.userId;
    return this.commit(
      id,
      {
        status: JobStatus.CANCELLED,
        cancelReason: dto.reason?.trim() || null,
        cancelledAt: new Date(),
        offerExpiresAt: null,
      },
      { expected: job.status, alsoNotifyUserIds: workerUserId ? [workerUserId] : [] },
    );
  }

}
