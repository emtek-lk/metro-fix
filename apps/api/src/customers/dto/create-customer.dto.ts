import { z } from 'zod';
import { FacilityType, SubscriptionTier } from '@metro-fix/core-types';

export const createCustomerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long.'),
  email: z.string().email('Please enter a valid email address.'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number.'),
  facilityType: z.nativeEnum(FacilityType),
  subscriptionTier: z.nativeEnum(SubscriptionTier).optional().default(SubscriptionTier.BASIC),
  physicalAddress: z.string().min(5, 'Physical address must be at least 5 characters long.'),
});

export class CreateCustomerDto {
  fullName: string;
  email: string;
  phoneNumber: string;
  facilityType: FacilityType;
  subscriptionTier?: SubscriptionTier;
  physicalAddress: string;
}
