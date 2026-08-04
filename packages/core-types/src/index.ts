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

  // Backward-compatibility aliases
  Requested = 'REQUESTED',
  PendingAcceptance = 'PENDING_ACCEPTANCE',
  Assigned = 'ASSIGNED',
  OnRoute = 'ON_ROUTE',
  Inspection = 'INSPECTION',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
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
  BASIC = 'BASIC',
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM',

  // Backward-compatibility aliases
  Basic = 'BASIC',
  Plus = 'PLUS',
  Premium = 'PREMIUM',
}

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
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type ServiceRequest = z.infer<typeof serviceRequestSchema>;

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