import {
  JobStatus,
  ServiceRequest,
  ServicePillar,
  FacilityType,
  User,
  WorkerJobQueueResponse,
} from '@metro-fix/core-types';
import { apiClient } from '../lib/api';
import { realtimeSocket } from './websocket';

export interface CreateJobInput {
  title: string;
  description: string;
  servicePillar: ServicePillar;
  facilityType: FacilityType;
  customerId: string;
  location: { latitude: number; longitude: number };
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
    realtimeSocket.emitLocalUpdate('job.created', created);
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
    realtimeSocket.emitLocalUpdate('job.updated', updated);
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
    realtimeSocket.emitLocalUpdate('job.updated', updated);
    return updated;
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
    realtimeSocket.emitLocalUpdate('job.updated', updated);
    return updated;
  }
}

export const apiService = new MobileApiService();
