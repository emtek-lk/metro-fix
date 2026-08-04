import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';

/**
 * Fetch assigned jobs for the authenticated worker via GET /workers/me/jobs
 */
export function useWorkerJobs() {
  return useQuery<ServiceRequest[], Error>({
    queryKey: ['workerJobs'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ServiceRequest[]>('/workers/me/jobs');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err: any) {
        if (err.response?.status === 401) {
          const fallback = await apiClient.get<ServiceRequest[]>('/jobs');
          return Array.isArray(fallback.data) ? fallback.data : [];
        }
        return [];
      }
    },
    refetchInterval: 10000,
  });
}

// Alias for backward compatibility across components
export const useMyJobs = useWorkerJobs;

/**
 * Fetch single job details via GET /jobs/:id
 */
export function useJobDetail(id?: string) {
  return useQuery<ServiceRequest, Error>({
    queryKey: ['jobDetail', id],
    queryFn: async () => {
      if (!id) throw new Error('Job ID is required');
      const response = await apiClient.get<ServiceRequest>(`/jobs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Mutation: Update job lifecycle status via PATCH /jobs/:id/status
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      status,
      workerId,
    }: {
      jobId: string;
      status: JobStatus;
      workerId?: string | null;
    }) => {
      const response = await apiClient.patch<ServiceRequest>(`/jobs/${jobId}/status`, {
        status,
        ...(workerId ? { workerId } : {}),
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobDetail', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
    },
  });
}

/**
 * Mutation: Submit inspection quote via POST /jobs/:id/quote
 * Payload: { estimatedCost, estimatedHours, notes }
 */
export function useSubmitQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      estimatedCost,
      estimatedHours,
      notes,
    }: {
      jobId: string;
      estimatedCost: number;
      estimatedHours: number;
      notes: string;
    }) => {
      const response = await apiClient.post<ServiceRequest>(`/jobs/${jobId}/quote`, {
        estimatedCost,
        estimatedHours,
        notes,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobDetail', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
    },
  });
}

/**
 * Mutation: Submit proof of work (signature + photos) via POST /jobs/:id/proof
 * Payload: { signature, photos }
 */
export function useSubmitProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      signature,
      photos,
    }: {
      jobId: string;
      signature: string;
      photos: string[];
    }) => {
      const response = await apiClient.post<ServiceRequest>(`/jobs/${jobId}/proof`, {
        signature,
        photos,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobDetail', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
    },
  });
}
