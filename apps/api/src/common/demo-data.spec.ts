import { JobStatus } from '@metro-fix/core-types';
import { DEMO_CUSTOMERS, DEMO_JOBS, DEMO_MARKER_EMAIL, DEMO_WORKERS } from './demo-data';

describe('demo dataset', () => {
  const customerEmails = new Set(DEMO_CUSTOMERS.map((c) => c.email));
  const workerEmails = new Set(DEMO_WORKERS.map((w) => w.email));

  it('has unique accounts and a marker customer', () => {
    expect(customerEmails.size).toBe(DEMO_CUSTOMERS.length);
    expect(workerEmails.size).toBe(DEMO_WORKERS.length);
    expect(customerEmails.has(DEMO_MARKER_EMAIL)).toBe(true);
    expect(DEMO_JOBS.map((j) => j.title)).toEqual([...new Set(DEMO_JOBS.map((j) => j.title))]);
  });

  it('only refers to people who exist', () => {
    for (const job of DEMO_JOBS) {
      expect(customerEmails.has(job.customer)).toBe(true);
      if (job.worker) expect(workerEmails.has(job.worker)).toBe(true);
    }
  });

  it('gives every job the fields its stage needs', () => {
    for (const job of DEMO_JOBS) {
      const started = [JobStatus.ASSIGNED, JobStatus.ON_ROUTE, JobStatus.INSPECTION, JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CLOSED, JobStatus.PENDING_ACCEPTANCE];
      if (started.includes(job.status)) expect(job.worker).toBeDefined();
      if ([JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CLOSED].includes(job.status)) expect(job.card).toBeDefined();
      if (job.status === JobStatus.CLOSED) expect(job.closedDaysAgo).toBeDefined();
      if (job.status === JobStatus.CANCELLED) expect(job.cancelReason).toBeTruthy();
      if (job.status === JobStatus.COMPLETED) expect(job.card?.finalLines).toBeDefined();
    }
  });

  it('covers the whole lifecycle so every board column has something', () => {
    const statuses = new Set(DEMO_JOBS.map((j) => j.status));
    for (const status of Object.values(JobStatus)) {
      if (['Requested', 'PendingAcceptance'].includes(status as string)) continue;
    }
    for (const needed of [
      JobStatus.REQUESTED, JobStatus.PENDING_ACCEPTANCE, JobStatus.ASSIGNED, JobStatus.ON_ROUTE, JobStatus.INSPECTION,
      JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CLOSED, JobStatus.CANCELLED,
    ]) {
      expect(statuses.has(needed)).toBe(true);
    }
  });

  it('subscribed customers have a billing cycle, and leads have neither', () => {
    for (const c of DEMO_CUSTOMERS) expect(Boolean(c.tier)).toBe(Boolean(c.billing));
    expect(DEMO_CUSTOMERS.filter((c) => !c.tier).length).toBeGreaterThanOrEqual(1);
  });
});
