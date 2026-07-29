import { ServicePillar, SubscriptionTier } from '@metro-fix/core-types';

export class CreateServiceDto {
  serviceName!: string;
  pillarCategory!: ServicePillar;
  basePrice!: string;
  requiredSubscriptionTier!: SubscriptionTier;
  status?: string;
}
