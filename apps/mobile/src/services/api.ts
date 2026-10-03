import { Platform } from 'react-native';
import {
  JobStatus,
  type CustomerSubscription,
  type CheckoutInput,
  type SignedInAppSettings,
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
  address?: string;
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

/** A subscription plan as GET /subscriptions returns it. */
export interface SubscriptionPlan {
  id: string;
  tierName: string;
  targetCustomer?: string | null;
  monthlyFeeLkr: number | null;
  annualFeeLkr: number | null;
  isCustomPriced: boolean;
  includedVisitsPerMonth?: number | null;
  includedLabourHoursPerMonth?: number | null;
  labourDiscountPct?: number;
  inspectionCadence?: string;
  callOutWaived?: boolean;
  includedServices?: string;
  status: string;
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
   * The worker's on-duty switch. Off-duty workers are not offered new jobs.
   * PATCH /workers/me/availability
   */
  async setAvailability(isAvailable: boolean): Promise<{ isAvailable: boolean }> {
    const res = await apiClient.patch('/workers/me/availability', { isAvailable });
    return res.data;
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
   * Uploads one job photo and returns the stored path (`/uploads/<id>.jpg`).
   * POST /uploads (multipart)
   */
  async uploadPhoto(uri: string): Promise<string> {
    const form = new FormData();
    if (Platform.OS === 'web') {
      // On web the picker hands back a blob / data URL, which has to be sent as a Blob.
      (form as any).append('file', await (await fetch(uri)).blob(), 'photo.jpg');
    } else {
      form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
    }
    const res = await apiClient.post('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data.url as string;
  }

  /**
   * Company contact, quoting defaults and request rules from Settings.
   * GET /settings/app
   */
  async fetchAppSettings(): Promise<SignedInAppSettings> {
    const res = await apiClient.get('/settings/app');
    return res.data;
  }

  /**
   * The plans on offer (public).
   * GET /subscriptions
   */
  async fetchPlans(): Promise<SubscriptionPlan[]> {
    const res = await apiClient.get('/subscriptions');
    return (res.data as SubscriptionPlan[]).filter((plan) => plan.status === 'Active');
  }

  /**
   * The signed-in customer's plan (tier is null until they subscribe) and payment history.
   * GET /subscriptions/me
   */
  async fetchMySubscription(): Promise<CustomerSubscription> {
    const res = await apiClient.get('/subscriptions/me');
    return res.data;
  }

  /**
   * Buy or change a plan with a (demo) card.
   * POST /subscriptions/checkout
   */
  async checkout(input: CheckoutInput): Promise<CustomerSubscription> {
    const res = await apiClient.post('/subscriptions/checkout', input);
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
      ...(input.address?.trim() ? { address: input.address.trim() } : {}),
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
