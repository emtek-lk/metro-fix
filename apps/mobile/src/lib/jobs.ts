import type { ServiceRequest } from '@metro-fix/core-types';

/** The customer's display name, as the API attaches it to a job. */
export function customerNameOf(job: Pick<ServiceRequest, 'customer' | 'customerId'>): string {
  return job.customer?.user?.fullName?.trim() || `Customer #${(job.customerId ?? '').slice(0, 4).toUpperCase() || 'Ref'}`;
}

/** The customer's phone number, if they have one on file. */
export function customerPhoneOf(job: Pick<ServiceRequest, 'customer'>): string | null {
  const phone = job.customer?.user?.phoneNumber?.trim();
  return phone ? phone : null;
}

export function workerNameOf(job: Pick<ServiceRequest, 'worker'>): string | null {
  return job.worker?.user?.fullName?.trim() || null;
}

/** "6.9271, 79.8612" or null when the job has no position. */
export function coordinatesOf(job: Pick<ServiceRequest, 'location'>): string | null {
  const location = job.location;
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return null;
  }
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}
