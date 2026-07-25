import { z } from 'zod';

export enum ServiceType {
  Hard = 'Hard',
  Soft = 'Soft',
  Strategic = 'Strategic',
}

export enum JobStatus {
  Requested = 'REQUESTED',
  PendingAcceptance = 'PENDING_ACCEPTANCE',
  Assigned = 'ASSIGNED',
  OnRoute = 'ON_ROUTE',
  Inspection = 'INSPECTION',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
}

export enum Role {
  Admin = 'Admin',
  CustomerCare = 'Customer Care',
  Customer = 'Customer',
  Worker = 'Worker',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  jobTitle: string;
  role: Role.Worker;
  serviceTypes: ServiceType[];
  coverageZones: string[];
  currentLocation?: string;
  rating: number;
  activeJobs: number;
  isAvailable: boolean;
}

export interface ServiceRequest {
  id: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  location: string;
  requestedByUserId: string;
  assignedWorkerId?: string | null;
  status: JobStatus;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required.'),
    email: z.string().trim().email('Enter a valid email address.'),
    phoneNumber: z.string().trim().min(7, 'Enter a valid phone number.').optional().or(z.literal('')),
    role: z.nativeEnum(Role).default(Role.Customer),
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