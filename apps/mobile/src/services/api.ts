import {
  JobStatus,
  ServiceRequest,
  ServicePillar,
  FacilityType,
  User,
  WorkerJobQueueResponse,
} from '@metro-fix/core-types';
import { apiClient } from '../lib/api';

export interface CreateJobInput {
  title: string;
  description: string;
  servicePillar: ServicePillar;
  facilityType: FacilityType;
  customerId: string;
  location: { latitude: number; longitude: number };
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/** A worker's own numbers for the Profile screen (GET /workers/me/stats). */
export interface WorkerStats {
  rating: number;
  completedJobs: number;
  activeJobs: number;
  pendingOffers: number;
  servicePillars: ServicePillar[];
  isAvailable: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export class MobileApiService {
  /**
   * Authenticate mobile user (Worker or Admin)
   * POST /auth/login
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  }

  /**
   * Fetch worker's assigned jobs queue
   * GET /workers/me/jobs
   */
  async fetchMyJobs(): Promise<WorkerJobQueueResponse> {
    const res = await apiClient.get('/workers/me/jobs');
    return res.data;
  }

  /**
   * Register Expo / FCM Push Token
   * POST /users/me/push-token
   */
  async registerPushToken(pushToken: string): Promise<User> {
    const res = await apiClient.post('/users/me/push-token', { pushToken });
    return res.data;
  }

  /**
   * Update worker GPS telemetry
   * POST /workers/me/location
   */
  async updateMyLocation(
    latitude: number,
    longitude: number,
    heading?: number | null,
    speed?: number | null,
  ): Promise<any> {
    const res = await apiClient.post('/workers/me/location', {
      latitude,
      longitude,
      heading: heading ?? undefined,
      speed: speed ?? undefined,
    });
    return res.data;
  }

  /**
   * Submits a new Service Request job to the NestJS API backend
   * POST /jobs
   */
  async createJob(input: CreateJobInput): Promise<ServiceRequest> {
    const res = await apiClient.post('/jobs', input);
    const created: ServiceRequest = res.data;
    return created;
  }

  /**
   * Updates a service request job status in the NestJS API backend
   * PATCH /jobs/:id/status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    workerId?: string | null,
  ): Promise<ServiceRequest> {
    const res = await apiClient.patch(`/jobs/${jobId}/status`, {
      status,
      workerId: workerId !== undefined ? workerId : undefined,
    });
    const updated: ServiceRequest = res.data;
    return updated;
  }

  /**
   * Get single job by ID
   * GET /jobs/:id
   */
  async getJob(jobId: string): Promise<ServiceRequest> {
    const res = await apiClient.get(`/jobs/${jobId}`);
    return res.data;
  }

  /**
   * Submits a cost and labor quote for a job ticket
   * POST /jobs/:id/quote
   */
  async submitJobQuote(
    jobId: string,
    estimatedCost: number,
    estimatedHours: number,
    notes: string,
  ): Promise<ServiceRequest> {
    const res = await apiClient.post(`/jobs/${jobId}/quote`, {
      estimatedCost,
      estimatedHours,
      notes,
    });
    const updated: ServiceRequest = res.data;
    return updated;
  }

  /**
   * Worker hands back a job they already accepted (e.g. unserviceable at inspection); it returns
   * to REQUESTED.
   * POST /jobs/:id/reject
   */
  async rejectJob(jobId: string, reason: string): Promise<ServiceRequest> {
    const res = await apiClient.post(`/jobs/${jobId}/reject`, { reason });
    return res.data;
  }

  /**
   * Worker accepts the job offered to them (PENDING_ACCEPTANCE -> ASSIGNED).
   * POST /jobs/:id/accept
   */
  async acceptOffer(jobId: string): Promise<ServiceRequest> {
    const res = await apiClient.post(`/jobs/${jobId}/accept`);
    return res.data;
  }

  /**
   * Worker declines the job offered to them; it goes back to dispatch.
   * POST /jobs/:id/decline
   */
  async declineOffer(jobId: string, reason?: string): Promise<ServiceRequest> {
    const res = await apiClient.post(`/jobs/${jobId}/decline`, reason ? { reason } : {});
    return res.data;
  }

  /**
   * Customer cancels their own request before work starts.
   * POST /jobs/:id/cancel
   */
  async cancelJob(jobId: string, reason?: string): Promise<ServiceRequest> {
    const res = await apiClient.post(`/jobs/${jobId}/cancel`, reason ? { reason } : {});
    return res.data;
  }

  /**
   * The signed-in customer's own requests.
   * GET /jobs/mine
   */
  async fetchMyRequests(): Promise<ServiceRequest[]> {
    const res = await apiClient.get('/jobs/mine');
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * The signed-in worker's rating, job counts and service pillars.
   * GET /workers/me/stats
   */
  async fetchMyStats(): Promise<WorkerStats> {
    const res = await apiClient.get('/workers/me/stats');
    return res.data;
  }

  /**
   * Customer self-registration; returns a signed-in session.
   * POST /auth/register
   */
  async register(input: RegisterInput): Promise<LoginResponse> {
    const res = await apiClient.post('/auth/register', {
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phone,
      password: input.password,
    });
    return res.data;
  }

  /**
   * Submits signature and photo proof for a job ticket
   * POST /jobs/:id/proof
   */
  async submitJobProof(
    jobId: string,
    signature: string,
    photos: string[],
  ): Promise<ServiceRequest> {
    const res = await apiClient.post(`/jobs/${jobId}/proof`, {
      signature,
      photos,
    });
    const updated: ServiceRequest = res.data;
    return updated;
  }
}

export const apiService = new MobileApiService();
