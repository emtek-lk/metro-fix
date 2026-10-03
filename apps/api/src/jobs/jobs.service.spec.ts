import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JobStatus } from '@metro-fix/core-types';
import { JobsService } from './jobs.service';

const JOB_ID = '3C96433E-F36B-1410-8C67-00B2BC2CF9FE';
const WORKER_ID = 'B443433E-F36B-1410-8C66-00B2BC2CF9FE';

function buildService(initial: { status: JobStatus; workerId: string | null }) {
  const job: any = { id: JOB_ID, ...initial };
  const jobRepo = {
    findOne: jest.fn(async () => ({ ...job })),
    update: jest.fn(async (_where: unknown, patch: Record<string, unknown>) => {
      Object.assign(job, patch);
    }),
  };
  const workerRepo = {
    findOne: jest.fn(async ({ where }: any) =>
      where.some((w: any) => w.id === WORKER_ID || w.userId === WORKER_ID)
        ? { id: WORKER_ID }
        : null,
    ),
  };
  const gateway = { emitJobUpdated: jest.fn(), emitJobCreated: jest.fn() };
  const service = new JobsService(jobRepo as any, workerRepo as any, {} as any, gateway as any);
  return { service, jobRepo, gateway, job };
}

describe('JobsService state machine', () => {
  const validPath: Array<[JobStatus, JobStatus]> = [
    [JobStatus.REQUESTED, JobStatus.PENDING_ACCEPTANCE],
    [JobStatus.PENDING_ACCEPTANCE, JobStatus.ASSIGNED],
    [JobStatus.ASSIGNED, JobStatus.ON_ROUTE],
    [JobStatus.ON_ROUTE, JobStatus.INSPECTION],
    [JobStatus.INSPECTION, JobStatus.IN_PROGRESS],
    [JobStatus.IN_PROGRESS, JobStatus.COMPLETED],
  ];

  it.each(validPath)('allows %s -> %s', async (from, to) => {
    const { service, gateway } = buildService({ status: from, workerId: WORKER_ID });
    const result = await service.updateJobStatus(JOB_ID, { status: to, workerId: WORKER_ID });
    expect(result.status).toBe(to);
    expect(gateway.emitJobUpdated).toHaveBeenCalledTimes(1);
  });

  it.each([
    [JobStatus.REQUESTED, JobStatus.INSPECTION],
    [JobStatus.REQUESTED, JobStatus.COMPLETED],
    [JobStatus.ASSIGNED, JobStatus.COMPLETED],
    [JobStatus.INSPECTION, JobStatus.REQUESTED],
    [JobStatus.ON_ROUTE, JobStatus.ASSIGNED],
    [JobStatus.COMPLETED, JobStatus.ON_ROUTE],
  ])('rejects %s -> %s', async (from, to) => {
    const { service, jobRepo } = buildService({ status: from, workerId: WORKER_ID });
    await expect(
      service.updateJobStatus(JOB_ID, { status: to, workerId: WORKER_ID }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it('treats re-sending the current status as a no-op', async () => {
    const { service, jobRepo } = buildService({ status: JobStatus.ON_ROUTE, workerId: WORKER_ID });
    const result = await service.updateJobStatus(JOB_ID, { status: JobStatus.ON_ROUTE });
    expect(result.status).toBe(JobStatus.ON_ROUTE);
    expect(jobRepo.update).not.toHaveBeenCalled();
  });

  it('requires a workerId to ping a worker', async () => {
    const { service } = buildService({ status: JobStatus.REQUESTED, workerId: null });
    await expect(
      service.updateJobStatus(JOB_ID, { status: JobStatus.PENDING_ACCEPTANCE }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown worker', async () => {
    const { service } = buildService({ status: JobStatus.REQUESTED, workerId: null });
    await expect(
      service.updateJobStatus(JOB_ID, {
        status: JobStatus.PENDING_ACCEPTANCE,
        workerId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears the worker when a pending job is rejected back to REQUESTED', async () => {
    const { service, jobRepo } = buildService({
      status: JobStatus.PENDING_ACCEPTANCE,
      workerId: WORKER_ID,
    });
    const result = await service.updateJobStatus(JOB_ID, { status: JobStatus.REQUESTED });
    expect(jobRepo.update).toHaveBeenCalledWith(
      { id: JOB_ID },
      { status: JobStatus.REQUESTED, workerId: null },
    );
    expect(result.workerId).toBeNull();
  });

  it('returns 404 for unknown or non-UUID job ids instead of fake data', async () => {
    const { service } = buildService({ status: JobStatus.REQUESTED, workerId: null });
    await expect(
      service.updateJobStatus('job_dispatch_909', { status: JobStatus.ASSIGNED }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('only accepts a quote at INSPECTION and proof at IN_PROGRESS', async () => {
    const early = buildService({ status: JobStatus.ASSIGNED, workerId: WORKER_ID });
    await expect(
      early.service.submitJobQuote(JOB_ID, { estimatedCost: 1, estimatedHours: 1, notes: '' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      early.service.submitJobProof(JOB_ID, { signature: 's', photos: [] } as any),
    ).rejects.toBeInstanceOf(ConflictException);

    const inspecting = buildService({ status: JobStatus.INSPECTION, workerId: WORKER_ID });
    const quoted = await inspecting.service.submitJobQuote(JOB_ID, {
      estimatedCost: 50,
      estimatedHours: 2,
      notes: 'n',
    } as any);
    expect(quoted.status).toBe(JobStatus.IN_PROGRESS);
  });
});
