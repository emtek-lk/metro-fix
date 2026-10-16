import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ServiceRequest } from '@metro-fix/core-types';
import { realtimeSocket } from '../services/websocket';

/**
 * Keeps the app live while someone is signed in: connects the realtime socket and, whenever a job
 * is created, updated or offered, refreshes the lists and the open job. After a reconnect it
 * refreshes everything, to catch what happened while the connection was down.
 */
export function useRealtimeSync(token: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return undefined;

    realtimeSocket.connect(token);

    const refreshLists = () => {
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      queryClient.invalidateQueries({ queryKey: ['workerStats'] });
    };
    const onJob = (job: ServiceRequest) => {
      if (job?.id) queryClient.setQueryData(['jobDetail', job.id], job);
      refreshLists();
    };
    const onReconnect = () => {
      refreshLists();
      queryClient.invalidateQueries({ queryKey: ['jobDetail'] });
    };

    const offs = [
      realtimeSocket.on('job.updated', onJob),
      realtimeSocket.on('job.created', onJob),
      realtimeSocket.on('job.offered', onJob),
      realtimeSocket.on('socket.connected', onReconnect),
    ];

    return () => {
      offs.forEach((off) => off());
      realtimeSocket.disconnect();
    };
  }, [token, queryClient]);
}
