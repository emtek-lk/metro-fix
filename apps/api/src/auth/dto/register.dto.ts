import { z } from 'zod';

// Mirrors the mobile sign-up form (apps/mobile/src/lib/validation.ts): the server is the source of truth.
const PHONE_DIGITS = /\d/g;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => {
      const digits = (value.match(PHONE_DIGITS) ?? []).length;
      return digits >= 7 && digits <= 15;
    }, 'Enter a valid phone number.'),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(128)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Include both letters and numbers.'),
});

export class RegisterDto {
  fullName!: string;
  email!: string;
  phoneNumber!: string;
  address?: string;
  password!: string;
}
