import { ServiceRequest, isFinishedStatus } from '@metro-fix/core-types';

export type JobFilter = 'all' | 'active' | 'done';

/** Finished work: completed by the technician, signed off (closed) by dispatch, or cancelled. */
const isDone = (job: Pick<ServiceRequest, 'status'>) => isFinishedStatus(job.status);

const stamp = (job: Pick<ServiceRequest, 'createdAt' | 'updatedAt'>): number =>
  new Date((job.updatedAt ?? job.createdAt) as string | Date).getTime() || 0;

export function countJobs(jobs: ServiceRequest[]): Record<JobFilter, number> {
  const done = jobs.filter(isDone).length;
  return { all: jobs.length, active: jobs.length - done, done };
}

export function filterJobs(jobs: ServiceRequest[], filter: JobFilter): ServiceRequest[] {
  if (filter === 'active') return jobs.filter((job) => !isDone(job));
  if (filter === 'done') return jobs.filter(isDone);
  return jobs;
}

/** Open work first, completed last; most recently touched first within each group. */
export function sortJobs(jobs: ServiceRequest[]): ServiceRequest[] {
  return [...jobs].sort((a, b) => {
    const group = Number(isDone(a)) - Number(isDone(b));
    return group !== 0 ? group : stamp(b) - stamp(a);
  });
}
