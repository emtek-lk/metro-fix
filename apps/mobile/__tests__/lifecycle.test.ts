import {
  JobStatus,
  JOB_STAGES,
  JOB_STATUSES_IN_ORDER,
  JOB_TRANSITIONS,
  canTransition,
  isCancellableStatus,
  isFinishedStatus,
  isTerminalStatus,
  stageNumber,
  OFFER_TIMEOUT_SECONDS,
} from '@metro-fix/core-types';
import { getStatusPresentation } from '../src/theme/status';
import { trackingMessage } from '../src/lib/trackingCopy';

describe('shared job lifecycle', () => {
  it('has the eight stages of the normal path, in order', () => {
    expect(JOB_STAGES).toEqual([
      JobStatus.REQUESTED,
      JobStatus.PENDING_ACCEPTANCE,
      JobStatus.ASSIGNED,
      JobStatus.ON_ROUTE,
      JobStatus.INSPECTION,
      JobStatus.IN_PROGRESS,
      JobStatus.COMPLETED,
      JobStatus.CLOSED,
    ]);
    expect(JOB_STATUSES_IN_ORDER).toEqual([...JOB_STAGES, JobStatus.CANCELLED]);
  });

  it('defines transitions for every status', () => {
    for (const status of JOB_STATUSES_IN_ORDER) {
      expect(JOB_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('lets each stage move to the next one on the normal path', () => {
    for (let i = 0; i < JOB_STAGES.length - 1; i += 1) {
      const from = JOB_STAGES[i];
      const next = JOB_STAGES[i + 1];
      // Dispatch can jump straight from REQUESTED to the offer; the offer then becomes ASSIGNED.
      expect(canTransition(from, next)).toBe(true);
    }
  });

  it('only allows the offer to be answered, withdrawn or cancelled', () => {
    const targets = JOB_TRANSITIONS[JobStatus.PENDING_ACCEPTANCE];
    expect([...targets].sort()).toEqual(
      [JobStatus.ASSIGNED, JobStatus.REQUESTED, JobStatus.CANCELLED].sort(),
    );
  });

  it('classifies finished and terminal statuses', () => {
    expect(isFinishedStatus(JobStatus.COMPLETED)).toBe(true);
    expect(isFinishedStatus(JobStatus.CLOSED)).toBe(true);
    expect(isFinishedStatus(JobStatus.CANCELLED)).toBe(true);
    expect(isFinishedStatus(JobStatus.IN_PROGRESS)).toBe(false);

    expect(isTerminalStatus(JobStatus.CLOSED)).toBe(true);
    expect(isTerminalStatus(JobStatus.CANCELLED)).toBe(true);
    // Completed still has the sign-off step ahead of it.
    expect(isTerminalStatus(JobStatus.COMPLETED)).toBe(false);
  });

  it('allows cancelling only before work starts', () => {
    expect(isCancellableStatus(JobStatus.REQUESTED)).toBe(true);
    expect(isCancellableStatus(JobStatus.PENDING_ACCEPTANCE)).toBe(true);
    expect(isCancellableStatus(JobStatus.INSPECTION)).toBe(true);
    expect(isCancellableStatus(JobStatus.IN_PROGRESS)).toBe(false);
    expect(isCancellableStatus(JobStatus.COMPLETED)).toBe(false);
    expect(isCancellableStatus(JobStatus.CANCELLED)).toBe(false);
  });

  it('numbers stages from one, and returns zero off the path', () => {
    expect(stageNumber(JobStatus.REQUESTED)).toBe(1);
    expect(stageNumber(JobStatus.CLOSED)).toBe(JOB_STAGES.length);
    expect(stageNumber(JobStatus.CANCELLED)).toBe(0);
  });

  it('gives workers a 9 hour window to answer an offer', () => {
    expect(OFFER_TIMEOUT_SECONDS).toBe(9 * 60 * 60);
  });
});

describe('presentation covers every status', () => {
  it.each(JOB_STATUSES_IN_ORDER.map((status) => [status]))('%s has a label, colour and icon', (status) => {
    const presentation = getStatusPresentation(status);
    expect(presentation.label).not.toBe('Unknown');
    expect(presentation.color).toMatch(/^#|^rgb/);
    expect(presentation.icon).toBeTruthy();
  });

  it.each(JOB_STATUSES_IN_ORDER.map((status) => [status]))('%s has customer-facing copy', (status) => {
    const message = trackingMessage(status, 'Carlos');
    expect(message.caption.length).toBeGreaterThan(0);
    expect(message.detail.length).toBeGreaterThan(0);
  });
});

describe('trackingMessage', () => {
  it('names the technician only once there is one', () => {
    expect(trackingMessage(JobStatus.REQUESTED, 'Carlos').detail).not.toContain('Carlos');
    expect(trackingMessage(JobStatus.ON_ROUTE, 'Carlos').detail).toContain('Carlos');
    expect(trackingMessage(JobStatus.ON_ROUTE).detail).toContain('Your technician');
  });

  it('does not claim progress that has not happened', () => {
    expect(trackingMessage(JobStatus.REQUESTED).caption).toBe('Waiting for dispatch');
    expect(trackingMessage(JobStatus.PENDING_ACCEPTANCE).detail).toContain('confirm');
  });
});
