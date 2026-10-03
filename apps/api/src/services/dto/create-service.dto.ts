import { z } from 'zod';
import { ServicePillar, ServiceGroup, SubscriptionTier } from '@metro-fix/core-types';

export const createServiceSchema = z.object({
  serviceName: z.string().trim().min(2),
  pillarCategory: z.nativeEnum(ServicePillar),
  serviceGroup: z.nativeEnum(ServiceGroup).nullable().optional(),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  requiresQuote: z.boolean().optional().default(false),
  basePrice: z.number().nonnegative().nullable().optional(),
  requiredSubscriptionTier: z.nativeEnum(SubscriptionTier),
  sortOrder: z.number().int().optional().default(0),
  status: z.string().optional(),
});

export class CreateServiceDto implements z.infer<typeof createServiceSchema> {
  serviceName!: string;
  pillarCategory!: ServicePillar;
  serviceGroup?: ServiceGroup | null;
  description?: string;
  icon?: string;
  requiresQuote!: boolean;
  basePrice?: number | null;
  requiredSubscriptionTier!: SubscriptionTier;
  sortOrder!: number;
  status?: string;
}
