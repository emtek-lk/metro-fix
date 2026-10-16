import type { JobCardPayload } from '../lib/jobCard';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { apiService, type WorkerStats, type SubscriptionPlan } from '../services/api';
import type { CustomerSubscription, CheckoutInput } from '@metro-fix/core-types';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';

/**
 * The signed-in worker's queue via GET /workers/me/jobs: accepted work plus any offer waiting for
 * an answer. Errors are surfaced (not swallowed into an empty list) so the roster can show its
 * error state with a retry. The realtime socket keeps it fresh; the interval is only a safety net.
 */
export function useWorkerJobs() {
  return useQuery<ServiceRequest[], Error>({
    queryKey: ['workerJobs'],
    queryFn: async () => {
      const response = await apiClient.get('/workers/me/jobs');
      const payload = response.data;
      return Array.isArray(payload) ? payload : (payload?.jobs ?? []);
    },
    refetchInterval: 30000,
  });
}

// Alias for backward compatibility across components
export const useMyJobs = useWorkerJobs;

/** The signed-in customer's own requests via GET /jobs/mine. */
export function useMyRequests(enabled = true) {
  return useQuery<ServiceRequest[], Error>({
    queryKey: ['myRequests'],
    queryFn: () => apiService.fetchMyRequests(),
    enabled,
    refetchInterval: 30000,
  });
}

/** The signed-in worker's rating and job counts via GET /workers/me/stats. */
export function useWorkerStats(enabled = true) {
  return useQuery<WorkerStats, Error>({
    queryKey: ['workerStats'],
    queryFn: () => apiService.fetchMyStats(),
    enabled,
  });
}

/** Flips the worker's on-duty switch; the Profile toggle updates at once and rolls back on failure. */
export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => apiService.setAvailability(isAvailable),
    onMutate: async (isAvailable) => {
      await queryClient.cancelQueries({ queryKey: ['workerStats'] });
      const previous = queryClient.getQueryData<WorkerStats>(['workerStats']);
      if (previous) queryClient.setQueryData<WorkerStats>(['workerStats'], { ...previous, isAvailable });
      return { previous };
    },
    onError: (_error, _value, context) => {
      if (context?.previous) queryClient.setQueryData(['workerStats'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['workerStats'] }),
  });
}

/** The plans on offer. */
export function usePlans() {
  return useQuery<SubscriptionPlan[], Error>({
    queryKey: ['plans'],
    queryFn: () => apiService.fetchPlans(),
    staleTime: 5 * 60 * 1000,
  });
}

/** The signed-in customer's plan; `tier` is null until they subscribe. */
export function useMySubscription(enabled = true) {
  return useQuery<CustomerSubscription, Error>({
    queryKey: ['mySubscription'],
    queryFn: () => apiService.fetchMySubscription(),
    enabled,
  });
}

/** Pays for a plan (demo card) and refreshes the customer's subscription. */
export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => apiService.checkout(input),
    onSuccess: (data) => queryClient.setQueryData(['mySubscription'], data),
  });
}

const refreshAfterJobChange = (queryClient: QueryClient, jobId: string) => {
  queryClient.invalidateQueries({ queryKey: ['jobDetail', jobId] });
  queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
  queryClient.invalidateQueries({ queryKey: ['myRequests'] });
  queryClient.invalidateQueries({ queryKey: ['workerStats'] });
};

/** Worker accepts the offered job. */
export function useAcceptOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => apiService.acceptOffer(jobId),
    onSettled: (_data, _error, jobId) => refreshAfterJobChange(queryClient, jobId),
  });
}

/** Worker declines the offered job. */
export function useDeclineOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason?: string }) =>
      apiService.declineOffer(jobId, reason),
    onSettled: (_data, _error, { jobId }) => refreshAfterJobChange(queryClient, jobId),
  });
}

/** Customer cancels their request. */
export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason?: string }) =>
      apiService.cancelJob(jobId, reason),
    onSettled: (_data, _error, { jobId }) => refreshAfterJobChange(queryClient, jobId),
  });
}

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
    onSuccess: (_data, variables) => refreshAfterJobChange(queryClient, variables.jobId),
  });
}

/**
 * Mutation: Submit inspection quote via POST /jobs/:id/quote
 * Payload: { lineItems, estimatedHours, notes } (the itemised job card)
 */
export function useSubmitQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      lineItems,
      estimatedHours,
      notes,
    }: {
      jobId: string;
      lineItems: JobCardPayload['lineItems'];
      estimatedHours: number;
      notes: string;
    }) => {
      const response = await apiClient.post<ServiceRequest>(`/jobs/${jobId}/quote`, {
        lineItems,
        estimatedHours,
        notes,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => refreshAfterJobChange(queryClient, variables.jobId),
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
      finalCard,
    }: {
      jobId: string;
      signature: string;
      photos: string[];
      /** The job card as confirmed or corrected at completion. */
      finalCard?: JobCardPayload;
    }) => {
      const response = await apiClient.post<ServiceRequest>(`/jobs/${jobId}/proof`, {
        signature,
        photos,
        finalCard,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => refreshAfterJobChange(queryClient, variables.jobId),
  });
}
