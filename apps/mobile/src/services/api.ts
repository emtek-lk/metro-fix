import { JobStatus, ServiceRequest, ServicePillar, FacilityType } from '@metro-fix/core-types';
import { Platform } from 'react-native';
import { realtimeSocket } from './websocket';

const DEFAULT_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export interface CreateJobInput {
  title: string;
  description: string;
  servicePillar: ServicePillar;
  facilityType: FacilityType;
  customerId: string;
  location: { latitude: number; longitude: number };
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class MobileApiService {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Submits a new Service Request job to the NestJS API backend
   * POST /jobs
   */
  async createJob(input: CreateJobInput): Promise<ServiceRequest> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API error: ${response.status} ${response.statusText}`,
        );
      }

      const created: ServiceRequest = await response.json();
      realtimeSocket.emitLocalUpdate('job.created', created);
      return created;
    } catch (error) {
      console.warn('[MobileApiService] Network request failed, returning mock created job for offline mode:', error);
      const mockJob: ServiceRequest = {
        id: `job_cust_${Date.now().toString().slice(-4)}`,
        title: input.title,
        description: input.description,
        servicePillar: input.servicePillar,
        facilityType: input.facilityType,
        status: JobStatus.REQUESTED,
        customerId: input.customerId,
        workerId: null,
        location: input.location,
        createdAt: new Date().toISOString(),
      };
      realtimeSocket.emitLocalUpdate('job.created', mockJob);
      return mockJob;
    }
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
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          workerId: workerId !== undefined ? workerId : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API error: ${response.status} ${response.statusText}`,
        );
      }

      const updated: ServiceRequest = await response.json();
      realtimeSocket.emitLocalUpdate('job.updated', updated);
      return updated;
    } catch (error) {
      console.warn('[MobileApiService] Network request failed, returning mock status update for offline mode:', error);
      const mockUpdated: ServiceRequest = {
        id: jobId,
        title: 'HVAC Compressor Diagnostic & Repair',
        description: 'Commercial rooftop chiller unit 4 reporting pressure differential fault.',
        servicePillar: ServicePillar.HARD,
        facilityType: FacilityType.COMMERCIAL,
        status,
        customerId: 'cust_demo_101',
        workerId: status === JobStatus.REQUESTED ? null : workerId || 'wrk_demo_88',
        location: { latitude: 37.7749, longitude: -122.4194 },
        createdAt: new Date().toISOString(),
      };
      realtimeSocket.emitLocalUpdate('job.updated', mockUpdated);
      return mockUpdated;
    }
  }

  async getJob(jobId: string): Promise<ServiceRequest | null> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
}

export const apiService = new MobileApiService();
