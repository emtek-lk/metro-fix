import { z } from 'zod';

// ==========================================
// Core Domain Enums
// ==========================================

export enum JobStatus {
  REQUESTED = 'REQUESTED',
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  ASSIGNED = 'ASSIGNED',
  ON_ROUTE = 'ON_ROUTE',
  INSPECTION = 'INSPECTION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',

  // Backward-compatibility aliases
  Requested = 'REQUESTED',
  PendingAcceptance = 'PENDING_ACCEPTANCE',
  Assigned = 'ASSIGNED',
  OnRoute = 'ON_ROUTE',
  Inspection = 'INSPECTION',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Closed = 'CLOSED',
  Cancelled = 'CANCELLED',
}

// ==========================================
// Job lifecycle (single source of truth)
// ==========================================
//
// The API enforces these rules; the web board and the mobile apps read the same definitions for
// column order, progress steppers, filters and drag/drop validation, so a change here reaches
// every app.
//
//   REQUESTED -> PENDING_ACCEPTANCE -> ASSIGNED -> ON_ROUTE -> INSPECTION -> IN_PROGRESS
//                                                                   -> COMPLETED -> CLOSED
//
// PENDING_ACCEPTANCE means "offered to one worker, awaiting their answer". An offer that is
// declined, withdrawn or left unanswered for OFFER_TIMEOUT_SECONDS returns to REQUESTED.
// A worker who rejects after accepting (ASSIGNED / INSPECTION) also returns the job to REQUESTED.
// CANCELLED can be reached from any state before work starts (IN_PROGRESS).

/** The normal path of a job, in order. CANCELLED sits outside it. */
export const JOB_STAGES: readonly JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.PENDING_ACCEPTANCE,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.CLOSED,
];

/** Every status in display order: the normal path, then CANCELLED. */
export const JOB_STATUSES_IN_ORDER: readonly JobStatus[] = [...JOB_STAGES, JobStatus.CANCELLED];

/** Which status a job may move to from each status. An absent target is not allowed. */
export const JOB_TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  [JobStatus.REQUESTED]: [JobStatus.PENDING_ACCEPTANCE, JobStatus.CANCELLED],
  // ASSIGNED = accepted; REQUESTED = declined, expired or withdrawn.
  [JobStatus.PENDING_ACCEPTANCE]: [JobStatus.ASSIGNED, JobStatus.REQUESTED, JobStatus.CANCELLED],
  // REQUESTED = the worker rejects the job after accepting it.
  [JobStatus.ASSIGNED]: [JobStatus.ON_ROUTE, JobStatus.REQUESTED, JobStatus.CANCELLED],
  [JobStatus.ON_ROUTE]: [JobStatus.INSPECTION, JobStatus.CANCELLED],
  [JobStatus.INSPECTION]: [JobStatus.IN_PROGRESS, JobStatus.REQUESTED, JobStatus.CANCELLED],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
  [JobStatus.COMPLETED]: [JobStatus.CLOSED],
  [JobStatus.CLOSED]: [],
  [JobStatus.CANCELLED]: [],
};

/** How long a worker has to answer an offer before it returns to the dispatch queue. */
export const OFFER_TIMEOUT_SECONDS = 9 * 60 * 60;

/** Clock text for a number of seconds: m:ss under an hour, h:mm:ss from an hour up. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const seconds = String(safe % 60).padStart(2, '0');
  if (safe >= 3600) {
    return `${Math.floor(safe / 3600)}:${String(Math.floor((safe % 3600) / 60)).padStart(2, '0')}:${seconds}`;
  }
  return `${Math.floor(safe / 60)}:${seconds}`;
}

/** Plain-words length of the offer window, e.g. "9 hours" or "90 seconds". */
export function describeOfferTimeout(totalSeconds: number = OFFER_TIMEOUT_SECONDS): string {
  if (totalSeconds % 3600 === 0) {
    const hours = totalSeconds / 3600;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  if (totalSeconds % 60 === 0) {
    const minutes = totalSeconds / 60;
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${totalSeconds} seconds`;
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

/** No further transitions are possible. */
export function isTerminalStatus(status: JobStatus): boolean {
  return (JOB_TRANSITIONS[status]?.length ?? 0) === 0;
}

/** Finished one way or another: completed, closed or cancelled. */
export function isFinishedStatus(status: JobStatus): boolean {
  return (
    status === JobStatus.COMPLETED ||
    status === JobStatus.CLOSED ||
    status === JobStatus.CANCELLED
  );
}

/** The job can still be cancelled. */
export function isCancellableStatus(status: JobStatus): boolean {
  return canTransition(status, JobStatus.CANCELLED);
}

/** 1-based position on the normal path (e.g. for "Stage 3 of 8"), or 0 for CANCELLED / unknown. */
export function stageNumber(status: JobStatus): number {
  return JOB_STAGES.indexOf(status) + 1;
}

/** Why an offer went back to the dispatch queue, or why a job came back after being accepted. */
export type JobOfferOutcome = 'DECLINED' | 'EXPIRED' | 'REJECTED' | 'WITHDRAWN';

export interface JobOfferRecord {
  workerId: string;
  outcome: JobOfferOutcome;
  reason?: string | null;
  /** ISO timestamp. */
  at: string;
}

export enum FacilityType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',

  // Backward-compatibility aliases
  Residential = 'RESIDENTIAL',
  Commercial = 'COMMERCIAL',
  Industrial = 'INDUSTRIAL',
}

export enum ServicePillar {
  HARD = 'HARD',
  SOFT = 'SOFT',
  STRATEGIC = 'STRATEGIC',

  // Backward-compatibility aliases
  Hard = 'HARD',
  Soft = 'SOFT',
  Strategic = 'STRATEGIC',
}

// Backwards compatibility alias
export { ServicePillar as ServiceType };

export enum SubscriptionTier {
  ACCESS = 'ACCESS',
  ESSENTIAL = 'ESSENTIAL',
  PLUS = 'PLUS',
  BUSINESS = 'BUSINESS',

  // Backward-compatibility aliases
  Access = 'ACCESS',
  Essential = 'ESSENTIAL',
  Plus = 'PLUS',
  Business = 'BUSINESS',
}

export enum ServiceGroup {
  // Hard facility services
  HVAC = 'HVAC',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  BUILDING_AUTOMATION = 'BUILDING_AUTOMATION',
  STRUCTURAL = 'STRUCTURAL',
  FIRE_SAFETY = 'FIRE_SAFETY',
  VERTICAL_TRANSPORT = 'VERTICAL_TRANSPORT',
  // Soft facility services
  CLEANING = 'CLEANING',
  WASTE = 'WASTE',
  SECURITY = 'SECURITY',
  GROUNDS = 'GROUNDS',
  CATERING = 'CATERING',
  SPACE_MAIL = 'SPACE_MAIL',
  // Strategic facility management
  ENERGY = 'ENERGY',
  COMPLIANCE = 'COMPLIANCE',
  ASSET_LIFECYCLE = 'ASSET_LIFECYCLE',
}

export type InspectionCadence = 'NONE' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER_CARE = 'CUSTOMER_CARE',
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',

  // Backward-compatibility aliases
  Admin = 'ADMIN',
  CustomerCare = 'CUSTOMER_CARE',
  Customer = 'CUSTOMER',
  Worker = 'WORKER',
}

// ==========================================
// Location / Spatial Schemas
// ==========================================

export const locationCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type LocationCoordinates = z.infer<typeof locationCoordinatesSchema>;

// ==========================================
// Core Entity Schemas & Types
// ==========================================

// Base User Schema
export const userSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.nativeEnum(Role),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  pushToken: z.string().optional().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type User = z.infer<typeof userSchema>;

// Worker Schema (Extends User with internal rating 1-5, location, pillars, status)
export const workerSchema = userSchema.extend({
  rating: z.number().min(1).max(5).default(5),
  location: locationCoordinatesSchema.optional(),
  servicePillars: z.array(z.nativeEnum(ServicePillar)).default([]),
  isAvailable: z.boolean().default(true),
  activeJobs: z.number().int().nonnegative().default(0),
});

export type Worker = z.infer<typeof workerSchema>;

// Customer Schema (Extends User with facility type and subscription tier)
export const customerSchema = userSchema.extend({
  facilityType: z.nativeEnum(FacilityType),
  subscriptionTier: z.nativeEnum(SubscriptionTier),
  facilityLocation: locationCoordinatesSchema.optional(),
});

export type Customer = z.infer<typeof customerSchema>;

// Service Request Schema (Core Job Ticket)
export const serviceRequestSchema = z.object({
  id: z.string(),
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(5, 'Description is required.'),
  servicePillar: z.nativeEnum(ServicePillar),
  facilityType: z.nativeEnum(FacilityType),
  status: z.nativeEnum(JobStatus).default(JobStatus.REQUESTED),
  customerId: z.string(),
  workerId: z.string().optional().nullable(),
  location: locationCoordinatesSchema,
  scheduledFor: z.union([z.string(), z.date()]).optional().nullable(),
  quoteAmount: z.number().nonnegative().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
  quoteNotes: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  urgency: z.string().optional(),
  /** When the current offer was made / when it lapses (only while PENDING_ACCEPTANCE). */
  offeredAt: z.union([z.string(), z.date()]).optional().nullable(),
  offerExpiresAt: z.union([z.string(), z.date()]).optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  cancelReason: z.string().optional().nullable(),
  cancelledAt: z.union([z.string(), z.date()]).optional().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

/** The customer or worker attached to a job, as the API returns it (password is never included). */
export interface JobParty {
  id: string;
  userId?: string;
  rating?: number;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string | null;
  };
}

export type ServiceRequest = z.infer<typeof serviceRequestSchema> & {
  customer?: JobParty | null;
  worker?: JobParty | null;
  /** Everyone this job was offered to and what they answered. */
  offerHistory?: JobOfferRecord[] | null;
};

// Worker Job Queue Response DTO
export interface WorkerJobQueueResponse {
  jobs: ServiceRequest[];
  total: number;
}

// Push Token DTO
export const registerPushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required.'),
});

export type RegisterPushTokenDto = z.infer<typeof registerPushTokenSchema>;

// Worker Location Telemetry DTO
export const updateWorkerLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
});

export type UpdateWorkerLocationDto = z.infer<typeof updateWorkerLocationSchema>;

// Job Quote DTO (worker estimate submission)
export const submitJobQuoteSchema = z.object({
  estimatedCost: z.number().nonnegative('Cost must be 0 or greater'),
  estimatedHours: z.number().nonnegative('Hours must be 0 or greater'),
  notes: z.string().default(''),
});

export type SubmitJobQuoteDto = z.infer<typeof submitJobQuoteSchema>;

// Job Proof DTO (signature and photo proof submission)
export const submitJobProofSchema = z.object({
  signature: z.string().min(10, 'Signature is required'),
  photos: z.array(z.string()).default([]),
});

export type SubmitJobProofDto = z.infer<typeof submitJobProofSchema>;

// ==========================================
// Auth & Form Schemas
// ==========================================

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required.'),
    email: z.string().trim().email('Enter a valid email address.'),
    phoneNumber: z.string().trim().min(7, 'Enter a valid phone number.').optional().or(z.literal('')),
    role: z.nativeEnum(Role).default(Role.CUSTOMER),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(8, 'Confirm the password.'),
    companyName: z.string().trim().min(2, 'Company name is required.').optional().or(z.literal('')),
    acceptTerms: z.boolean().refine((value) => value, {
      message: 'Accept the terms to continue.',
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;