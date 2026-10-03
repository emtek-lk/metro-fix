import { z } from 'zod';
import { ServicePillar, FacilityType } from '@metro-fix/core-types';

// core-types ships zod v3 schemas; the API validates with zod v4, so nested schemas must be local.
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(5, 'Description must be at least 5 characters long.'),
  servicePillar: z.nativeEnum(ServicePillar),
  facilityType: z.nativeEnum(FacilityType),
  customerId: z.string().min(1, 'Customer ID is required.'),
  location: locationSchema,
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
});

export class CreateJobDto {
  title: string;
  description: string;
  servicePillar: ServicePillar;
  facilityType: FacilityType;
  customerId: string;
  location: { latitude: number; longitude: number };
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
