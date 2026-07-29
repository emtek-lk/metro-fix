import { SubscriptionTier, FacilityType } from '@metro-fix/core-types';

export class CreateSubscriptionDto {
  tierName!: SubscriptionTier;
  targetFacility!: FacilityType;
  monthlyFee!: string;
  includedServices?: string;
  status?: string;
}
