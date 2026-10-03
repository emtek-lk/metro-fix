import { z } from 'zod';
import { FacilityType, SubscriptionTier } from '@metro-fix/core-types';

const PHONE_DIGITS = /\d/g;

/** Admin edit of a customer. Every field is optional; only what is sent changes. */
export const updateCustomerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long.').max(120).optional(),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254).optional(),
    phoneNumber: z
      .string()
      .trim()
      .refine((v) => {
        const digits = (v.match(PHONE_DIGITS) ?? []).length;
        return digits >= 7 && digits <= 15;
      }, 'Enter a valid phone number.')
      .optional(),
    companyName: z.string().trim().max(200).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    facilityType: z.nativeEnum(FacilityType).optional(),
    /** Null removes the plan (back to a lead). Staff set this without a payment, e.g. to comp a plan. */
    subscriptionTier: z.nativeEnum(SubscriptionTier).nullable().optional(),
    billingCycle: z.enum(['MONTHLY', 'ANNUAL']).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export class UpdateCustomerDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string | null;
  address?: string | null;
  facilityType?: FacilityType;
  subscriptionTier?: SubscriptionTier | null;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | null;
}
