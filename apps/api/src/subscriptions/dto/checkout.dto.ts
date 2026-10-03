import { z } from 'zod';
import { SubscriptionTier } from '@metro-fix/core-types';

// core-types ships zod v3; the API validates with zod v4, so this schema is local.
export const checkoutSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
  card: z.object({
    number: z.string().min(1, 'Enter the card number.').max(30),
    name: z.string().max(80),
    expiry: z.string().max(7),
    cvc: z.string().max(4),
  }),
});

export class CheckoutDto {
  tier!: SubscriptionTier;
  billingCycle!: 'MONTHLY' | 'ANNUAL';
  card!: { number: string; name: string; expiry: string; cvc: string };
}
