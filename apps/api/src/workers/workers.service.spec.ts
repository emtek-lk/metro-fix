import { NotFoundException } from '@nestjs/common';
import { JobStatus, ServicePillar, type JobOfferRecord } from '@metro-fix/core-types';
import { WorkersService } from './workers.service';

function build(statuses: JobStatus[], offerHistory: JobOfferRecord[] | null = null) {
  const worker = {
    id: 'w1',
    userId: 'u1',
    rating: 4.8,
    servicePillars: [ServicePillar.HARD, ServicePillar.STRATEGIC],
    isAvailable: true,
    latitude: 6.92,
    longitude: 79.85,
    user: { fullName: 'Carlos' },
  };
  const other = { ...worker, id: 'w2', userId: 'u2', latitude: 6.93, user: { fullName: 'Priya' } };
  const workerRepo = {
    findOne: jest.fn(async ({ where }: any) => (where.userId === 'u1' ? worker : null)),
    find: jest.fn(async () => [worker, other]),
  };
  const jobRepo = {
    find: jest.fn(async () => statuses.map((status) => ({ status }))),
    findOne: jest.fn(async () => ({ id: 'job-1', latitude: 6.9, longitude: 79.8, offerHistory })),
  };
  const service = new WorkersService(workerRepo as any, jobRepo as any, {} as any);
  return { service, jobRepo };
}

describe('WorkersService.getStatsForUser', () => {
  it('counts completed, active and pending-offer jobs separately', async () => {
    const { service } = build([
      JobStatus.COMPLETED,
      JobStatus.CLOSED,
      JobStatus.CLOSED,
      JobStatus.ASSIGNED,
      JobStatus.IN_PROGRESS,
      JobStatus.PENDING_ACCEPTANCE,
      JobStatus.CANCELLED,
    ]);
    await expect(service.getStatsForUser('u1')).resolves.toEqual({
      rating: 4.8,
      completedJobs: 3,
      activeJobs: 2,
      pendingOffers: 1,
      servicePillars: [ServicePillar.HARD, ServicePillar.STRATEGIC],
      isAvailable: true,
    });
  });

  it('is all zeroes for a worker with no jobs', async () => {
    const { service } = build([]);
    await expect(service.getStatsForUser('u1')).resolves.toMatchObject({
      completedJobs: 0,
      activeJobs: 0,
      pendingOffers: 0,
    });
  });

  it('404s for a user with no worker profile', async () => {
    const { service } = build([]);
    await expect(service.getStatsForUser('nobody')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('WorkersService.findJobsForWorkerUser', () => {
  it("returns only this worker's own jobs, never everyone's, when they have none", async () => {
    const { service, jobRepo } = build([]);
    const result = await service.findJobsForWorkerUser('u1');
    expect(result).toEqual({ jobs: [], total: 0 });
    expect(jobRepo.find).toHaveBeenCalledTimes(1);
  });
});

describe('dispatch search', () => {
  it('skips workers who already declined or rejected the job', async () => {
    const { service } = build([], [
      { workerId: 'w1', outcome: 'DECLINED', at: new Date().toISOString() },
    ]);
    const results = await service.getAvailableWorkersForJob('job-1');
    expect(results.map((r) => r.worker.id)).toEqual(['w2']);
  });

  it('still suggests workers whose earlier offer only expired', async () => {
    const { service } = build([], [
      { workerId: 'w1', outcome: 'EXPIRED', at: new Date().toISOString() },
    ]);
    const results = await service.getAvailableWorkersForJob('job-1');
    expect(results.map((r) => r.worker.id).sort()).toEqual(['w1', 'w2']);
  });
});

describe('dispatch availability', () => {
  const makeService = (opts: { w1?: Partial<any>; openJobs?: { workerId: string }[]; history?: JobOfferRecord[] }) => {
    const base = { rating: 4.5, servicePillars: [ServicePillar.HARD], isAvailable: true, latitude: 6.92, longitude: 79.85, user: { fullName: 'x' } };
    const w1 = { ...base, id: 'w1', userId: 'u1', ...opts.w1 };
    const w2 = { ...base, id: 'w2', userId: 'u2', rating: 4 };
    const workerRepo = {
      find: jest.fn(async () => [w1, w2]),
      findOne: jest.fn(async () => w1),
      save: jest.fn(async (v: any) => v),
    };
    const jobRepo = {
      findOne: jest.fn(async () => ({ id: 'job-1', latitude: 6.9, longitude: 79.8, offerHistory: opts.history ?? null })),
      find: jest.fn(async () => opts.openJobs ?? []),
    };
    return { service: new WorkersService(workerRepo as any, jobRepo as any, {} as any), workerRepo };
  };

  it('leaves off-duty workers out, unless dispatch asks for everyone', async () => {
    const { service } = makeService({ w1: { isAvailable: false } });
    expect((await service.getAvailableWorkersForJob('job-1')).map((r) => r.worker.id)).toEqual(['w2']);
    const all = await service.getAvailableWorkersForJob('job-1', 50000, true);
    expect(all.map((r) => [r.worker.id, r.unavailableReason])).toEqual([
      ['w2', null],
      ['w1', 'OFF_DUTY'],
    ]);
  });

  it('treats a worker at the active-job cap as unavailable', async () => {
    const openJobs = Array.from({ length: 5 }, () => ({ workerId: 'w1' }));
    const { service } = makeService({ openJobs });
    const all = await service.getAvailableWorkersForJob('job-1', 50000, true);
    expect(all.find((r) => r.worker.id === 'w1')).toMatchObject({ available: false, unavailableReason: 'AT_CAPACITY', activeJobs: 5 });
  });

  it('flags a worker who declined this job', async () => {
    const { service } = makeService({ history: [{ workerId: 'w1', outcome: 'DECLINED', at: new Date().toISOString() }] });
    const all = await service.getAvailableWorkersForJob('job-1', 50000, true);
    expect(all.find((r) => r.worker.id === 'w1')?.unavailableReason).toBe('DECLINED_THIS_JOB');
  });

  it('lets a worker flip their own on-duty switch', async () => {
    const { service, workerRepo } = makeService({});
    const updated = await service.setAvailability('u1', false);
    expect(updated.isAvailable).toBe(false);
    expect(workerRepo.save).toHaveBeenCalled();
  });
});

describe('WorkersService.findAll', () => {
  it('adds each worker\'s live workload', async () => {
    const workers = [{ id: 'w1', user: {} }, { id: 'w2', user: {} }];
    const workerRepo = { find: jest.fn(async () => workers) };
    const jobRepo = { find: jest.fn(async () => [{ workerId: 'w1' }, { workerId: 'w1' }, { workerId: null }]) };
    const service = new WorkersService(workerRepo as any, jobRepo as any, {} as any);
    const result = await service.findAll();
    expect(result.map((w) => [w.id, w.liveActiveJobs])).toEqual([['w1', 2], ['w2', 0]]);
  });
});

describe('WorkersService.updateWorker', () => {
  const make = (taken: any = null) => {
    const user: any = { id: 'u1', email: 'ruwan@demo.local', fullName: 'Ruwan Kumara', phoneNumber: '1' };
    const worker: any = { id: 'w1', userId: 'u1', user, rating: 4.8, servicePillars: ['HARD'], isAvailable: true };
    const workerRepo = { findOne: jest.fn(async () => worker), save: jest.fn(async (v: any) => v) };
    const userRepo = { findOne: jest.fn(async () => taken), save: jest.fn(async (v: any) => v) };
    return { service: new WorkersService(workerRepo as any, {} as any, userRepo as any), worker, user };
  };

  it('updates contact details, rating, services and duty status', async () => {
    const { service, worker, user } = make();
    await service.updateWorker('w1', { fullName: 'Ruwan K. Perera', rating: 4.2, servicePillars: ['HARD', 'SOFT'] as any, isAvailable: false });
    expect(user.fullName).toBe('Ruwan K. Perera');
    expect(worker).toMatchObject({ rating: 4.2, servicePillars: ['HARD', 'SOFT'], isAvailable: false });
  });

  it('keeps the email unique', async () => {
    const { service } = make({ id: 'other', email: 'taken@demo.local' });
    await expect(service.updateWorker('w1', { email: 'taken@demo.local' })).rejects.toThrow('already uses');
  });
});
