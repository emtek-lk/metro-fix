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
