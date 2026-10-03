import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { countUnread, notificationsFromJobs, type AppNotification } from '../lib/notifications';
import { useWorkerJobs } from './useJobs';

const readKey = (userId: string) => `metrofix_read_alerts_${userId}`;

/**
 * The worker's alerts, derived from their real job queue (see `notificationsFromJobs`). Which
 * alerts have been opened is remembered per account on the device.
 */
export function useNotifications(): {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
} {
  const { user } = useAuth();
  const { data: jobs } = useWorkerJobs();
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    storage
      .getItemAsync(readKey(userId))
      .then((saved) => {
        if (!active || !saved) return;
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setReadIds(new Set(parsed.filter((id) => typeof id === 'string')));
        } catch {
          // A corrupt value just means everything shows as unread again.
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId]);

  const persist = useCallback(
    (next: ReadonlySet<string>) => {
      if (userId) {
        // Keep the list bounded: the newest 200 ids are plenty.
        storage.setItemAsync(readKey(userId), JSON.stringify([...next].slice(-200))).catch(() => undefined);
      }
    },
    [userId],
  );

  const items = useMemo(() => notificationsFromJobs(jobs ?? [], readIds), [jobs, readIds]);
  const unreadCount = useMemo(() => countUnread(items), [items]);

  const markRead = useCallback(
    (id: string) =>
      setReadIds((current) => {
        if (current.has(id)) return current;
        const next = new Set(current).add(id);
        persist(next);
        return next;
      }),
    [persist],
  );

  const markAllRead = useCallback(
    () =>
      setReadIds((current) => {
        const next = new Set(current);
        items.forEach((item) => next.add(item.id));
        persist(next);
        return next;
      }),
    [items, persist],
  );

  return { items, unreadCount, markRead, markAllRead };
}
