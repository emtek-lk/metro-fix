import { JobStatus, type ServiceRequest } from '@metro-fix/core-types';
import { customerNameOf } from './jobs';

export type NotificationKind = 'dispatch' | 'quote' | 'location' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  unread: boolean;
}

export interface NotificationGroup {
  title: 'Today' | 'Earlier';
  data: AppNotification[];
}

const startOfDay = (time: number): number => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/** Splits a feed into "Today" and "Earlier", newest first, dropping empty groups. */
export function groupNotifications(
  items: AppNotification[],
  now: number = Date.now(),
): NotificationGroup[] {
  const today = startOfDay(now);
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const groups: NotificationGroup[] = [
    { title: 'Today', data: sorted.filter((n) => new Date(n.createdAt).getTime() >= today) },
    { title: 'Earlier', data: sorted.filter((n) => new Date(n.createdAt).getTime() < today) },
  ];
  return groups.filter((group) => group.data.length > 0);
}

export const countUnread = (items: AppNotification[]): number =>
  items.reduce((total, item) => total + (item.unread ? 1 : 0), 0);

/** Finished-job notices older than this are not worth showing any more. */
const NOTICE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const toIso = (value: string | Date | null | undefined, fallback: string): string => {
  if (!value) return fallback;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? fallback : new Date(time).toISOString();
};

/**
 * The worker's alerts, derived from their own jobs: a new offer waiting for an answer, a job that
 * was cancelled, a ticket dispatch has closed. Ids include the status, so a job reaching a new
 * state raises a fresh alert; `readIds` remembers which ones were opened.
 */
export function notificationsFromJobs(
  jobs: ServiceRequest[],
  readIds: ReadonlySet<string>,
  now: number = Date.now(),
): AppNotification[] {
  const items: AppNotification[] = [];

  for (const job of jobs) {
    const id = `${job.id}:${job.status}`;
    const updatedAt = toIso(job.updatedAt ?? job.createdAt, new Date(now).toISOString());
    const customer = customerNameOf(job);

    if (job.status === JobStatus.PENDING_ACCEPTANCE) {
      items.push({
        id,
        kind: 'dispatch',
        title: 'New job offer',
        body: `${job.title} for ${customer}. Open it to accept or decline.`,
        createdAt: toIso(job.offeredAt, updatedAt),
        unread: !readIds.has(id),
      });
      continue;
    }

    const at = new Date(updatedAt).getTime();
    if (now - at > NOTICE_WINDOW_MS) continue;

    if (job.status === JobStatus.CANCELLED) {
      items.push({
        id,
        kind: 'system',
        title: 'Job cancelled',
        body: job.cancelReason
          ? `${job.title} was cancelled: ${job.cancelReason}`
          : `${job.title} was cancelled. You don't need to do anything.`,
        createdAt: toIso(job.cancelledAt, updatedAt),
        unread: !readIds.has(id),
      });
    } else if (job.status === JobStatus.CLOSED) {
      items.push({
        id,
        kind: 'quote',
        title: 'Ticket closed',
        body: `Dispatch reviewed your proof of work and closed ${job.title}.`,
        createdAt: updatedAt,
        unread: !readIds.has(id),
      });
    }
  }

  return items;
}
