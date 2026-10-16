import { z } from 'zod';
import { SubscriptionTier, FacilityType } from '@metro-fix/core-types';

export const createSubscriptionSchema = z.object({
  tierName: z.nativeEnum(SubscriptionTier),
  targetFacility: z.nativeEnum(FacilityType),
  targetCustomer: z.string().trim().optional(),
  monthlyFeeLkr: z.number().nonnegative().nullable().optional(),
  annualFeeLkr: z.number().nonnegative().nullable().optional(),
  isCustomPriced: z.boolean().optional().default(false),
  includedVisitsPerMonth: z.number().int().nonnegative().nullable().optional(),
  includedLabourHoursPerMonth: z.number().nonnegative().nullable().optional(),
  labourDiscountPct: z.number().min(0).max(100).optional().default(0),
  inspectionCadence: z.enum(['NONE', 'ANNUAL', 'QUARTERLY', 'MONTHLY']).optional().default('NONE'),
  callOutWaived: z.boolean().optional().default(false),
  includedServices: z.string().optional(),
  status: z.string().optional(),
});

export class CreateSubscriptionDto implements z.infer<typeof createSubscriptionSchema> {
  tierName!: SubscriptionTier;
  targetFacility!: FacilityType;
  targetCustomer?: string;
  monthlyFeeLkr?: number | null;
  annualFeeLkr?: number | null;
  isCustomPriced!: boolean;
  includedVisitsPerMonth?: number | null;
  includedLabourHoursPerMonth?: number | null;
  labourDiscountPct!: number;
  inspectionCadence!: 'NONE' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  callOutWaived!: boolean;
  includedServices?: string;
  status?: string;
}
