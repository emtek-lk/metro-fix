import { useCallback, useState } from 'react';

/**
 * State for a pull-to-refresh control around any async reload. The spinner shows until every
 * reload settles, even if one fails (the screen shows its own error state).
 */
export function usePullRefresh(reload: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } catch {
      // The data hooks surface their own errors.
    } finally {
      setRefreshing(false);
    }
  }, [reload]);
  return { refreshing, onRefresh };
}
