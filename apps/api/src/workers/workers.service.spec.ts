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
