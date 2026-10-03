import { z } from 'zod';
import { ServicePillar } from '@metro-fix/core-types';

const PHONE_DIGITS = /\d/g;

/** Admin edit of a worker. Every field is optional; only what is sent changes. */
export const updateWorkerSchema = z
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
    /** The internal 1-5 quality rating dispatch ranks workers by. */
    rating: z.number().min(1, 'Rating is 1 to 5.').max(5, 'Rating is 1 to 5.').optional(),
    servicePillars: z.array(z.nativeEnum(ServicePillar)).min(1, 'Pick at least one service.').optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export class UpdateWorkerDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  rating?: number;
  servicePillars?: ServicePillar[];
  isAvailable?: boolean;
}
