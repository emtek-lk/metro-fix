import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { countJobs, filterJobs, sortJobs } from '../src/lib/jobFilters';

const job = (id: string, status: JobStatus, updatedAt: string): ServiceRequest =>
  ({ id, status, createdAt: '2026-10-01T00:00:00Z', updatedAt }) as unknown as ServiceRequest;

const jobs = [
  job('done-old', JobStatus.COMPLETED, '2026-10-02T00:00:00Z'),
  job('active-old', JobStatus.ASSIGNED, '2026-10-02T08:00:00Z'),
  job('active-new', JobStatus.IN_PROGRESS, '2026-10-03T08:00:00Z'),
  job('done-new', JobStatus.COMPLETED, '2026-10-03T00:00:00Z'),
  job('closed', JobStatus.CLOSED, '2026-10-01T00:00:00Z'),
];

describe('job filters', () => {
  it('counts all, active and done', () => {
    expect(countJobs(jobs)).toEqual({ all: 5, active: 2, done: 3 });
    expect(countJobs([])).toEqual({ all: 0, active: 0, done: 0 });
  });

  it('filters by completion', () => {
    expect(filterJobs(jobs, 'all')).toHaveLength(5);
    expect(filterJobs(jobs, 'active').map((j) => j.id)).toEqual(['active-old', 'active-new']);
    expect(filterJobs(jobs, 'done').map((j) => j.id)).toEqual(['done-old', 'done-new', 'closed']);
  });

  it('sorts open work first and newest first within each group, without mutating the input', () => {
    const snapshot = jobs.map((j) => j.id);
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(['active-new', 'active-old', 'done-new', 'done-old', 'closed']);
    expect(jobs.map((j) => j.id)).toEqual(snapshot);
  });

  it('falls back to createdAt when updatedAt is missing', () => {
    const a = { id: 'a', status: JobStatus.ASSIGNED, createdAt: '2026-10-03T00:00:00Z' } as unknown as ServiceRequest;
    const b = { id: 'b', status: JobStatus.ASSIGNED, createdAt: '2026-10-01T00:00:00Z' } as unknown as ServiceRequest;
    expect(sortJobs([b, a]).map((j) => j.id)).toEqual(['a', 'b']);
  });
});
