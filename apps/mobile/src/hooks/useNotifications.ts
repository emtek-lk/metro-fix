import { useCallback, useMemo, useState } from 'react';
import { AppNotification, countUnread } from '../lib/notifications';

/**
 * Sample feed so the Alerts screen can be reviewed in development. Release builds start empty and
 * show the real empty state instead of invented notifications.
 */
const buildSampleFeed = (): AppNotification[] => {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  return [
    {
      id: 'sample-dispatch',
      kind: 'dispatch',
      title: 'Priority dispatch',
      body: 'A new commercial HVAC ticket is available 2.4 km away.',
      createdAt: ago(10),
      unread: true,
    },
    {
      id: 'sample-quote',
      kind: 'quote',
      title: 'Quote approved by customer',
      body: 'Elevator shaft safety inspection quote accepted. You can start work.',
      createdAt: ago(130),
      unread: true,
    },
    {
      id: 'sample-location',
      kind: 'location',
      title: 'Location sharing active',
      body: 'Background location is on for your assigned route.',
      createdAt: ago(60 * 26),
      unread: false,
    },
  ];
};

/**
 * The worker's notification feed.
 *
 * TODO(backend): replace the seed with the real feed (push notifications / an API endpoint). The
 * rest of the app only depends on this hook's return shape.
 */
export function useNotifications(): {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
} {
  const [items, setItems] = useState<AppNotification[]>(() => (__DEV__ ? buildSampleFeed() : []));

  const markRead = useCallback(
    (id: string) =>
      setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item))),
    [],
  );
  const markAllRead = useCallback(
    () => setItems((current) => current.map((item) => ({ ...item, unread: false }))),
    [],
  );
  const unreadCount = useMemo(() => countUnread(items), [items]);

  return { items, unreadCount, markRead, markAllRead };
}
