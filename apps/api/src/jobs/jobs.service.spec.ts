import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  JobStatus,
  Role,
  JOB_TRANSITIONS,
  OFFER_TIMEOUT_SECONDS,
  type JobOfferRecord,
} from '@metro-fix/core-types';
import { JobsService, type Actor } from './jobs.service';

const JOB_ID = '3C96433E-F36B-1410-8C67-00B2BC2CF9FE';
const W1 = 'B443433E-F36B-1410-8C66-00B2BC2CF9FE';
const W2 = 'C943433E-F36B-1410-8C66-00B2BC2CF9FE';

const staff: Actor = { id: 'staff-1', role: Role.CUSTOMER_CARE };
const worker1: Actor = { id: 'user-w1', role: Role.WORKER };
const worker2: Actor = { id: 'user-w2', role: Role.WORKER };
const customer: Actor = { id: 'user-c1', role: Role.CUSTOMER };
const otherCustomer: Actor = { id: 'user-c2', role: Role.CUSTOMER };

interface Initial {
  status: JobStatus;
  workerId?: string | null;
  offerExpiresAt?: Date | null;
  offerHistory?: JobOfferRecord[] | null;
  jobCard?: unknown;
}

/** An in-memory stand-in for the repositories and gateway, enough to exercise the service rules. */
function build(initial: Initial) {
  const workers = [
    { id: W1, userId: 'user-w1', rating: 5 },
    { id: W2, userId: 'user-w2', rating: 4 },
  ];
  const job: any = {
    id: JOB_ID,
    customerId: 'cust-1',
    customer: { id: 'cust-1', userId: 'user-c1' },
    workerId: null,
    offerExpiresAt: null,
    offerHistory: null,
    rejectReason: null,
    ...initial,
  };
  const view = () => ({
    ...job,
    worker: job.workerId ? workers.find((w) => w.id === job.workerId) ?? null : null,
  });

  let loseNextRace = false;
  const jobRepo = {
    findOne: jest.fn(async () => view()),
    find: jest.fn(async ({ where }: any) => {
      const deadline = where?.offerExpiresAt?.value as Date | undefined;
      const matches =
        job.status === where?.status &&
        job.offerExpiresAt &&
        (!deadline || new Date(job.offerExpiresAt).getTime() <= deadline.getTime());
      return matches ? [view()] : [];
    }),
    update: jest.fn(async (criteria: any, patch: Record<string, unknown>) => {
      if (loseNextRace || (criteria.status && criteria.status !== job.status)) {
        loseNextRace = false;
        return { affected: 0 };
      }
      Object.assign(job, patch);
      return { affected: 1 };
    }),
    create: jest.fn((value: any) => value),
    save: jest.fn(async (value: any) => ({ ...value, id: JOB_ID })),
  };
  const workerRepo = {
    findOne: jest.fn(async ({ where }: any) => {
      const clauses = Array.isArray(where) ? where : [where];
      return (
        workers.find((w) => clauses.some((c: any) => c.id === w.id || c.userId === w.userId)) ?? null
      );
    }),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1', userId: 'user-c1' })),
  };
  const gateway = {
    emitJobUpdated: jest.fn(),
    emitJobCreated: jest.fn(),
    emitJobOffered: jest.fn(),
  };
  const service = new JobsService(
    jobRepo as any,
    workerRepo as any,
    customerRepo as any,
    gateway as any,
  );
  return { service, jobRepo, gateway, job, loseNextRace: () => (loseNextRace = true) };
}

const lastHistory = (job: any): JobOfferRecord => job.offerHistory[job.offerHistory.length - 1];

describe('lifecycle rules (shared definition)', () => {
  it('lets dispatch make the normal field moves through the status endpoint', async () => {
    const steps: Array<[JobStatus, JobStatus]> = [
      [JobStatus.PENDING_ACCEPTANCE, JobStatus.ASSIGNED],
      [JobStatus.ASSIGNED, JobStatus.ON_ROUTE],
      [JobStatus.ON_ROUTE, JobStatus.INSPECTION],
      [JobStatus.INSPECTION, JobStatus.IN_PROGRESS],
      [JobStatus.IN_PROGRESS, JobStatus.COMPLETED],
      [JobStatus.COMPLETED, JobStatus.CLOSED],
    ];
    for (const [from, to] of steps) {
      const { service } = build({ status: from, workerId: W1 });
      const result = await service.updateJobStatus(JOB_ID, { status: to }, staff);
      expect(result.status).toBe(to);
    }
  });

  it.each([
    [JobStatus.REQUESTED, JobStatus.ASSIGNED],
    [JobStatus.REQUESTED, JobStatus.INSPECTION],
    [JobStatus.REQUESTED, JobStatus.COMPLETED],
    [JobStatus.PENDING_ACCEPTANCE, JobStatus.ON_ROUTE],
    [JobStatus.ASSIGNED, JobStatus.COMPLETED],
    [JobStatus.ON_ROUTE, JobStatus.REQUESTED],
    [JobStatus.IN_PROGRESS, JobStatus.CLOSED],
    [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
    [JobStatus.CLOSED, JobStatus.REQUESTED],
    [JobStatus.CANCELLED, JobStatus.REQUESTED],
    [JobStatus.COMPLETED, JobStatus.ON_ROUTE],
  ])('rejects %s -> %s', async (from, to) => {
    const { service, jobRepo } = build({ status: from, workerId: W1 });
    await expect(
      service.updateJobStatus(JOB_ID, { status: to, workerId: W1 }, staff),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it('treats re-sending the current status as a no-op', async () => {
    const { service, jobRepo } = build({ status: JobStatus.ON_ROUTE, workerId: W1 });
    const result = await service.updateJobStatus(JOB_ID, { status: JobStatus.ON_ROUTE }, staff);
    expect(result.status).toBe(JobStatus.ON_ROUTE);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown or non-UUID job ids instead of fake data', async () => {
    const { service } = build({ status: JobStatus.REQUESTED });
    await expect(
      service.updateJobStatus('job_dispatch_909', { status: JobStatus.PENDING_ACCEPTANCE }, staff),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows cancelling from every state before work starts, and only those', () => {
    const cancellable = Object.entries(JOB_TRANSITIONS)
      .filter(([, targets]) => targets.includes(JobStatus.CANCELLED))
      .map(([status]) => status);
    expect(cancellable.sort()).toEqual(
      [
        JobStatus.REQUESTED,
        JobStatus.PENDING_ACCEPTANCE,
        JobStatus.ASSIGNED,
        JobStatus.ON_ROUTE,
        JobStatus.INSPECTION,
      ].sort(),
    );
  });
});

describe('offers', () => {
  it('offers a job to one worker and starts the countdown', async () => {
    const { service, gateway, job } = build({ status: JobStatus.REQUESTED });
    const before = Date.now();

    const result = await service.offerWorker(JOB_ID, W1);

    expect(result.status).toBe(JobStatus.PENDING_ACCEPTANCE);
    expect(job.workerId).toBe(W1);
    const seconds = (new Date(job.offerExpiresAt).getTime() - before) / 1000;
    expect(seconds).toBeGreaterThan(OFFER_TIMEOUT_SECONDS - 2);
    expect(seconds).toBeLessThan(OFFER_TIMEOUT_SECONDS + 2);
    expect(gateway.emitJobUpdated).toHaveBeenCalledTimes(1);
    expect(gateway.emitJobOffered).toHaveBeenCalledTimes(1);
  });

  it('honours OFFER_TIMEOUT_SECONDS from the environment', async () => {
    process.env.OFFER_TIMEOUT_SECONDS = '30';
    try {
      const { service, job } = build({ status: JobStatus.REQUESTED });
      await service.offerWorker(JOB_ID, W1);
      const seconds = (new Date(job.offerExpiresAt).getTime() - Date.now()) / 1000;
      expect(seconds).toBeLessThan(31);
    } finally {
      delete process.env.OFFER_TIMEOUT_SECONDS;
    }
  });

  it('only offers jobs that are waiting in the queue', async () => {
    const { service } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(service.offerWorker(JOB_ID, W2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an unknown worker', async () => {
    const { service } = build({ status: JobStatus.REQUESTED });
    await expect(
      service.offerWorker(JOB_ID, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('will not offer a job to someone who already declined or rejected it', async () => {
    for (const outcome of ['DECLINED', 'REJECTED'] as const) {
      const { service } = build({
        status: JobStatus.REQUESTED,
        offerHistory: [{ workerId: W1, outcome, at: new Date().toISOString() }],
      });
      await expect(service.offerWorker(JOB_ID, W1)).rejects.toBeInstanceOf(ConflictException);
    }
  });

  it('does allow re-offering to someone whose earlier offer simply expired', async () => {
    const { service } = build({
      status: JobStatus.REQUESTED,
      offerHistory: [{ workerId: W1, outcome: 'EXPIRED', at: new Date().toISOString() }],
    });
    await expect(service.offerWorker(JOB_ID, W1)).resolves.toMatchObject({
      status: JobStatus.PENDING_ACCEPTANCE,
    });
  });

  it('keeps assignWorker as an alias for offering', async () => {
    const { service } = build({ status: JobStatus.REQUESTED });
    const result = await service.assignWorker(JOB_ID, W1);
    expect(result.status).toBe(JobStatus.PENDING_ACCEPTANCE);
  });
});

describe('accepting an offer', () => {
  const pending = (extra: Partial<Initial> = {}): Initial => ({
    status: JobStatus.PENDING_ACCEPTANCE,
    workerId: W1,
    offerExpiresAt: new Date(Date.now() + 60_000),
    ...extra,
  });

  it('assigns the job to the worker who was offered it', async () => {
    const { service, job } = build(pending());
    const result = await service.acceptOffer(JOB_ID, worker1);
    expect(result.status).toBe(JobStatus.ASSIGNED);
    expect(job.offerExpiresAt).toBeNull();
    expect(job.workerId).toBe(W1);
  });

  it("refuses someone else's offer", async () => {
    const { service, jobRepo } = build(pending());
    await expect(service.acceptOffer(JOB_ID, worker2)).rejects.toBeInstanceOf(ForbiddenException);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it('refuses when there is no pending offer', async () => {
    const { service } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(service.acceptOffer(JOB_ID, worker1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns an overdue offer to the queue instead of accepting it', async () => {
    const { service, job } = build(pending({ offerExpiresAt: new Date(Date.now() - 1000) }));
    await expect(service.acceptOffer(JOB_ID, worker1)).rejects.toBeInstanceOf(ConflictException);
    expect(job.status).toBe(JobStatus.REQUESTED);
    expect(job.workerId).toBeNull();
    expect(lastHistory(job)).toMatchObject({ workerId: W1, outcome: 'EXPIRED' });
  });

  it('loses cleanly when the offer was taken back at the same moment', async () => {
    const { service, loseNextRace } = build(pending());
    loseNextRace();
    await expect(service.acceptOffer(JOB_ID, worker1)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('declining an offer', () => {
  const pending: Initial = {
    status: JobStatus.PENDING_ACCEPTANCE,
    workerId: W1,
    offerExpiresAt: new Date(Date.now() + 60_000),
  };

  it('returns the job to the queue and remembers who declined and why', async () => {
    const { service, job, gateway } = build(pending);
    const result = await service.declineOffer(JOB_ID, { reason: 'Too far away' }, worker1);

    expect(result.status).toBe(JobStatus.REQUESTED);
    expect(job.workerId).toBeNull();
    expect(job.offerExpiresAt).toBeNull();
    expect(job.rejectReason).toBe('Too far away');
    expect(lastHistory(job)).toMatchObject({ workerId: W1, outcome: 'DECLINED', reason: 'Too far away' });
    // The worker who lost the job is told, so their screen clears.
    expect(gateway.emitJobUpdated).toHaveBeenCalledWith(expect.anything(), ['user-w1']);
  });

  it('works without a reason', async () => {
    const { service, job } = build(pending);
    await service.declineOffer(JOB_ID, {}, worker1);
    expect(lastHistory(job).outcome).toBe('DECLINED');
  });

  it("refuses someone else's offer", async () => {
    const { service } = build(pending);
    await expect(service.declineOffer(JOB_ID, {}, worker2)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses when nothing is pending', async () => {
    const { service } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(service.declineOffer(JOB_ID, {}, worker1)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('offer timeout', () => {
  it('returns an unanswered offer to the queue and records it as expired', async () => {
    const { service, job, gateway } = build({
      status: JobStatus.PENDING_ACCEPTANCE,
      workerId: W1,
      offerExpiresAt: new Date(Date.now() - 5000),
    });

    const expired = await service.expireStaleOffers();

    expect(expired).toBe(1);
    expect(job.status).toBe(JobStatus.REQUESTED);
    expect(job.workerId).toBeNull();
    expect(lastHistory(job)).toMatchObject({ workerId: W1, outcome: 'EXPIRED' });
    expect(gateway.emitJobUpdated).toHaveBeenCalledWith(expect.anything(), ['user-w1']);
  });

  it('leaves offers that still have time on the clock', async () => {
    const { service, job } = build({
      status: JobStatus.PENDING_ACCEPTANCE,
      workerId: W1,
      offerExpiresAt: new Date(Date.now() + 60_000),
    });
    expect(await service.expireStaleOffers()).toBe(0);
    expect(job.status).toBe(JobStatus.PENDING_ACCEPTANCE);
  });

  it('does nothing for jobs that are not waiting on an offer', async () => {
    const { service } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    expect(await service.expireStaleOffers()).toBe(0);
  });
});

describe('dispatch actions through the status endpoint', () => {
  it('needs a worker to offer a job', async () => {
    const { service } = build({ status: JobStatus.REQUESTED });
    await expect(
      service.updateJobStatus(JOB_ID, { status: JobStatus.PENDING_ACCEPTANCE }, staff),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('makes an offer when given one', async () => {
    const { service } = build({ status: JobStatus.REQUESTED });
    const result = await service.updateJobStatus(
      JOB_ID,
      { status: JobStatus.PENDING_ACCEPTANCE, workerId: W2 },
      staff,
    );
    expect(result).toMatchObject({ status: JobStatus.PENDING_ACCEPTANCE, workerId: W2 });
  });

  it('withdraws a pending offer back to the queue', async () => {
    const { service, job } = build({
      status: JobStatus.PENDING_ACCEPTANCE,
      workerId: W1,
      offerExpiresAt: new Date(Date.now() + 60_000),
    });
    await service.updateJobStatus(JOB_ID, { status: JobStatus.REQUESTED }, staff);
    expect(job.status).toBe(JobStatus.REQUESTED);
    expect(job.workerId).toBeNull();
    expect(lastHistory(job).outcome).toBe('WITHDRAWN');
  });

  it('takes an accepted job back from its worker', async () => {
    const { service, job } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await service.updateJobStatus(JOB_ID, { status: JobStatus.REQUESTED }, staff);
    expect(job.workerId).toBeNull();
    expect(lastHistory(job).outcome).toBe('WITHDRAWN');
  });

  it('routes a cancel through the cancel rules', async () => {
    const { service, job } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await service.updateJobStatus(JOB_ID, { status: JobStatus.CANCELLED }, staff);
    expect(job.status).toBe(JobStatus.CANCELLED);
    expect(job.cancelledAt).toBeInstanceOf(Date);
  });
});

describe('what a worker may do', () => {
  it('can start travel and arrive on site on their own job', async () => {
    const travel = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(
      travel.service.updateJobStatus(JOB_ID, { status: JobStatus.ON_ROUTE }, worker1),
    ).resolves.toMatchObject({ status: JobStatus.ON_ROUTE });

    const arrive = build({ status: JobStatus.ON_ROUTE, workerId: W1 });
    await expect(
      arrive.service.updateJobStatus(JOB_ID, { status: JobStatus.INSPECTION }, worker1),
    ).resolves.toMatchObject({ status: JobStatus.INSPECTION });
  });

  it("cannot touch another worker's job", async () => {
    const { service, jobRepo } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(
      service.updateJobStatus(JOB_ID, { status: JobStatus.ON_ROUTE }, worker2),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it.each([JobStatus.ASSIGNED, JobStatus.COMPLETED, JobStatus.CLOSED, JobStatus.REQUESTED])(
    'cannot set %s directly',
    async (target) => {
      const { service } = build({ status: JobStatus.INSPECTION, workerId: W1 });
      await expect(
        service.updateJobStatus(JOB_ID, { status: target }, worker1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it("cannot read another worker's job, but customers read only their own", async () => {
    const { service } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(service.findOneFor(JOB_ID, worker2)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.findOneFor(JOB_ID, worker1)).resolves.toBeDefined();
    await expect(service.findOneFor(JOB_ID, otherCustomer)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.findOneFor(JOB_ID, customer)).resolves.toBeDefined();
    await expect(service.findOneFor(JOB_ID, staff)).resolves.toBeDefined();
  });
});

describe('quote, proof and reject', () => {
  it('only accepts a quote at INSPECTION and proof at IN_PROGRESS', async () => {
    const early = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(
      early.service.submitJobQuote(JOB_ID, { estimatedCost: 1, estimatedHours: 1, notes: '' } as any, worker1),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      early.service.submitJobProof(JOB_ID, { signature: 's', photos: [] } as any, worker1),
    ).rejects.toBeInstanceOf(ConflictException);

    const inspecting = build({ status: JobStatus.INSPECTION, workerId: W1 });
    const quoted = await inspecting.service.submitJobQuote(
      JOB_ID,
      { estimatedCost: 50, estimatedHours: 2, notes: 'n' } as any,
      worker1,
    );
    expect(quoted.status).toBe(JobStatus.IN_PROGRESS);
  });

  it('stores an itemised job card with server-computed totals', async () => {
    const { service, job } = build({ status: JobStatus.INSPECTION, workerId: W1 });
    await service.submitJobQuote(
      JOB_ID,
      {
        lineItems: [
          { kind: 'LABOUR', description: 'Technician', quantity: 2, unitPrice: 1500 },
          { kind: 'MATERIAL', description: 'Valve', quantity: 3, unitPrice: 250.5 },
        ],
        taxRate: 10,
        notes: 'n',
      } as any,
      worker1,
    );
    expect(job.jobCard.estimate).toMatchObject({ subtotal: 3751.5, tax: 375.15, total: 4126.65, hours: 2 });
    expect(job.jobCard.final).toBeNull();
    expect(job.quoteAmount).toBe(4126.65);
    expect(job.estimatedHours).toBe(2);
  });

  it('turns the flat cost form into a single line', async () => {
    const { service, job } = build({ status: JobStatus.INSPECTION, workerId: W1 });
    await service.submitJobQuote(JOB_ID, { estimatedCost: 80, estimatedHours: 1.5, notes: '' } as any, worker1);
    expect(job.jobCard.estimate.lineItems).toHaveLength(1);
    expect(job.jobCard.estimate.total).toBe(80);
  });

  it('records the final card confirmed at completion, keeping the estimate', async () => {
    const { service, job } = build({
      status: JobStatus.IN_PROGRESS,
      workerId: W1,
      jobCard: { currency: 'LKR', taxRate: 0, estimate: { lineItems: [], hours: 1, notes: '', subtotal: 100, tax: 0, total: 100, savedAt: 'x' }, final: null },
    });
    await service.submitJobProof(
      JOB_ID,
      { signature: 'sig', photos: [], finalCard: { lineItems: [{ kind: 'LABOUR', description: 'Work', quantity: 3, unitPrice: 50 }], hours: 3, notes: '' } } as any,
      worker1,
    );
    expect(job.jobCard.estimate.total).toBe(100);
    expect(job.jobCard.final).toMatchObject({ total: 150, hours: 3 });
  });

  it('lets dispatch correct the final card until the ticket is closed', async () => {
    const dispatcher: Actor = { id: 'user-cc', role: Role.CUSTOMER_CARE };
    const body = { lineItems: [{ kind: 'OTHER', description: 'Fix', quantity: 1, unitPrice: 20 }], hours: 1, notes: '' } as any;
    const open = build({ status: JobStatus.COMPLETED, workerId: W1 });
    await open.service.updateFinalCard(JOB_ID, body, dispatcher);
    expect(open.job.jobCard.final.total).toBe(20);

    const closed = build({ status: JobStatus.CLOSED, workerId: W1 });
    await expect(closed.service.updateFinalCard(JOB_ID, body, dispatcher)).rejects.toBeInstanceOf(ConflictException);
  });

  it('only lets the assigned worker quote or complete', async () => {
    const { service } = build({ status: JobStatus.INSPECTION, workerId: W1 });
    await expect(
      service.submitJobQuote(JOB_ID, { estimatedCost: 1, estimatedHours: 1, notes: '' } as any, worker2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets an accepted worker hand the job back, clearing them and recording why', async () => {
    const { service, job, gateway } = build({ status: JobStatus.INSPECTION, workerId: W1 });
    const result = await service.rejectJob(JOB_ID, { reason: 'Outside my trade' }, worker1);

    expect(result.status).toBe(JobStatus.REQUESTED);
    expect(job.workerId).toBeNull();
    expect(job.rejectReason).toBe('Outside my trade');
    expect(lastHistory(job)).toMatchObject({ workerId: W1, outcome: 'REJECTED', reason: 'Outside my trade' });
    expect(gateway.emitJobUpdated).toHaveBeenCalledWith(expect.anything(), ['user-w1']);
  });

  it('refuses to reject a job already in progress, or one that is not theirs', async () => {
    const inProgress = build({ status: JobStatus.IN_PROGRESS, workerId: W1 });
    await expect(
      inProgress.service.rejectJob(JOB_ID, { reason: 'Too late' }, worker1),
    ).rejects.toBeInstanceOf(ConflictException);

    const notTheirs = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(
      notTheirs.service.rejectJob(JOB_ID, { reason: 'Not mine' }, worker2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('closes only completed jobs', async () => {
    const early = build({ status: JobStatus.IN_PROGRESS, workerId: W1 });
    await expect(early.service.closeJob(JOB_ID)).rejects.toBeInstanceOf(ConflictException);

    const done = build({ status: JobStatus.COMPLETED, workerId: W1 });
    await expect(done.service.closeJob(JOB_ID)).resolves.toMatchObject({ status: JobStatus.CLOSED });
  });
});

describe('cancelling', () => {
  it.each([
    JobStatus.REQUESTED,
    JobStatus.PENDING_ACCEPTANCE,
    JobStatus.ASSIGNED,
    JobStatus.ON_ROUTE,
    JobStatus.INSPECTION,
  ])('lets a customer cancel their own request while it is %s', async (status) => {
    const { service, job } = build({ status, workerId: status === JobStatus.REQUESTED ? null : W1 });
    const result = await service.cancelJob(JOB_ID, { reason: 'No longer needed' }, customer);
    expect(result.status).toBe(JobStatus.CANCELLED);
    expect(job.cancelReason).toBe('No longer needed');
    expect(job.offerExpiresAt).toBeNull();
  });

  it('tells the worker so their screen clears', async () => {
    const { service, gateway } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await service.cancelJob(JOB_ID, {}, customer);
    expect(gateway.emitJobUpdated).toHaveBeenCalledWith(expect.anything(), ['user-w1']);
  });

  it("does not let a customer cancel someone else's request", async () => {
    const { service, jobRepo } = build({ status: JobStatus.REQUESTED });
    await expect(service.cancelJob(JOB_ID, {}, otherCustomer)).rejects.toBeInstanceOf(ForbiddenException);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it('lets dispatch cancel any request', async () => {
    const { service } = build({ status: JobStatus.ASSIGNED, workerId: W1 });
    await expect(service.cancelJob(JOB_ID, {}, staff)).resolves.toMatchObject({
      status: JobStatus.CANCELLED,
    });
  });

  it.each([JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CLOSED])(
    'is too late once the job is %s',
    async (status) => {
      const { service } = build({ status, workerId: W1 });
      await expect(service.cancelJob(JOB_ID, {}, customer)).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('says so when it is already cancelled', async () => {
    const { service } = build({ status: JobStatus.CANCELLED });
    await expect(service.cancelJob(JOB_ID, {}, customer)).rejects.toThrow('already cancelled');
  });
});
