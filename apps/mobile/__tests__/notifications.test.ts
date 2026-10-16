import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import {
  AppNotification,
  countUnread,
  groupNotifications,
  notificationsFromJobs,
} from '../src/lib/notifications';

const NOW = new Date('2026-10-03T15:00:00').getTime();
const note = (id: string, createdAt: string, unread = false): AppNotification => ({
  id,
  kind: 'system',
  title: id,
  body: '',
  createdAt,
  unread,
});

describe('groupNotifications', () => {
  it('splits into Today and Earlier, newest first', () => {
    const groups = groupNotifications(
      [
        note('yesterday', '2026-10-02T22:00:00'),
        note('morning', '2026-10-03T08:00:00'),
        note('noon', '2026-10-03T12:00:00'),
        note('last-week', '2026-09-26T09:00:00'),
      ],
      NOW,
    );
    expect(groups.map((g) => g.title)).toEqual(['Today', 'Earlier']);
    expect(groups[0].data.map((n) => n.id)).toEqual(['noon', 'morning']);
    expect(groups[1].data.map((n) => n.id)).toEqual(['yesterday', 'last-week']);
  });

  it('drops groups that would be empty', () => {
    expect(groupNotifications([note('a', '2026-10-03T09:00:00')], NOW).map((g) => g.title)).toEqual(['Today']);
    expect(groupNotifications([note('a', '2026-09-01T09:00:00')], NOW).map((g) => g.title)).toEqual(['Earlier']);
    expect(groupNotifications([], NOW)).toEqual([]);
  });

  it('does not mutate its input', () => {
    const input = [note('a', '2026-10-01T09:00:00'), note('b', '2026-10-03T09:00:00')];
    groupNotifications(input, NOW);
    expect(input.map((n) => n.id)).toEqual(['a', 'b']);
  });
});

describe('countUnread', () => {
  it('counts unread items', () => {
    expect(countUnread([note('a', '2026-10-03T09:00:00', true), note('b', '2026-10-03T10:00:00')])).toBe(1);
    expect(countUnread([])).toBe(0);
  });
});

describe('notificationsFromJobs', () => {
  const now = new Date('2026-10-03T12:00:00Z').getTime();
  const job = (extra: Record<string, unknown>): ServiceRequest =>
    ({
      id: 'job-1',
      title: 'Lobby AC not cooling',
      customerId: 'cust',
      customer: { user: { fullName: 'Eleanor Vance' } },
      createdAt: '2026-10-03T09:00:00Z',
      updatedAt: '2026-10-03T11:00:00Z',
      ...extra,
    }) as unknown as ServiceRequest;

  it('raises an unread alert for a job offered to the worker', () => {
    const [alert] = notificationsFromJobs(
      [job({ status: JobStatus.PENDING_ACCEPTANCE, offeredAt: '2026-10-03T11:58:00Z' })],
      new Set(),
      now,
    );
    expect(alert).toMatchObject({ id: 'job-1:PENDING_ACCEPTANCE', kind: 'dispatch', title: 'New job offer', unread: true });
    expect(alert.body).toContain('Eleanor Vance');
    expect(alert.createdAt).toBe('2026-10-03T11:58:00.000Z');
  });

  it('remembers which alerts were opened, per job state', () => {
    const jobs = [job({ status: JobStatus.PENDING_ACCEPTANCE, offeredAt: '2026-10-03T11:58:00Z' })];
    const [read] = notificationsFromJobs(jobs, new Set(['job-1:PENDING_ACCEPTANCE']), now);
    expect(read.unread).toBe(false);
    // The same job in a new state is a new alert.
    const [cancelled] = notificationsFromJobs(
      [job({ status: JobStatus.CANCELLED })],
      new Set(['job-1:PENDING_ACCEPTANCE']),
      now,
    );
    expect(cancelled.unread).toBe(true);
  });

  it('tells the worker about cancellations, with the reason when given', () => {
    const [plain] = notificationsFromJobs([job({ status: JobStatus.CANCELLED })], new Set(), now);
    expect(plain).toMatchObject({ title: 'Job cancelled' });
    const [withReason] = notificationsFromJobs(
      [job({ status: JobStatus.CANCELLED, cancelReason: 'Fixed it myself' })],
      new Set(),
      now,
    );
    expect(withReason.body).toContain('Fixed it myself');
  });

  it('tells the worker when dispatch closes a ticket', () => {
    const [closed] = notificationsFromJobs([job({ status: JobStatus.CLOSED })], new Set(), now);
    expect(closed).toMatchObject({ title: 'Ticket closed' });
  });

  it('says nothing about routine progress, and drops old finished notices', () => {
    const quiet = notificationsFromJobs(
      [
        job({ id: 'a', status: JobStatus.ASSIGNED }),
        job({ id: 'b', status: JobStatus.IN_PROGRESS }),
        job({ id: 'c', status: JobStatus.CLOSED, updatedAt: '2026-08-01T00:00:00Z' }),
      ],
      new Set(),
      now,
    );
    expect(quiet).toEqual([]);
  });
});
