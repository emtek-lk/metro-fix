import { z } from 'zod';
import { ServicePillar, FacilityType, locationCoordinatesSchema } from '@metro-fix/core-types';

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(5, 'Description must be at least 5 characters long.'),
  servicePillar: z.nativeEnum(ServicePillar),
  facilityType: z.nativeEnum(FacilityType),
  customerId: z.string().min(1, 'Customer ID is required.'),
  location: locationCoordinatesSchema,
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
