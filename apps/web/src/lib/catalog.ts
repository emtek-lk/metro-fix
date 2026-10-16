import { ServiceGroup, ServicePillar, SubscriptionTier } from '@metro-fix/core-types';

export const PILLAR_LABELS: Record<ServicePillar, string> = {
  [ServicePillar.HARD]: 'Hard Facility Services',
  [ServicePillar.SOFT]: 'Soft Facility Services',
  [ServicePillar.STRATEGIC]: 'Strategic Facility Management',
};

export const PILLAR_BLURBS: Record<ServicePillar, string> = {
  [ServicePillar.HARD]: 'Building fabric & machinery',
  [ServicePillar.SOFT]: 'Operations & workplace comfort',
  [ServicePillar.STRATEGIC]: 'Planning, compliance & cost control',
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.ACCESS]: 'MetroFix Access',
  [SubscriptionTier.ESSENTIAL]: 'MetroFix Essential',
  [SubscriptionTier.PLUS]: 'MetroFix Plus',
  [SubscriptionTier.BUSINESS]: 'MetroFix Business',
};

export const SERVICE_GROUP_LABELS: Record<ServiceGroup, string> = {
  [ServiceGroup.HVAC]: 'HVAC',
  [ServiceGroup.ELECTRICAL]: 'Electrical',
  [ServiceGroup.PLUMBING]: 'Plumbing & Water',
  [ServiceGroup.BUILDING_AUTOMATION]: 'Building Automation',
  [ServiceGroup.STRUCTURAL]: 'Structural',
  [ServiceGroup.FIRE_SAFETY]: 'Fire Safety',
  [ServiceGroup.VERTICAL_TRANSPORT]: 'Lifts & Escalators',
  [ServiceGroup.CLEANING]: 'Cleaning',
  [ServiceGroup.WASTE]: 'Waste',
  [ServiceGroup.SECURITY]: 'Security',
  [ServiceGroup.GROUNDS]: 'Grounds & Landscaping',
  [ServiceGroup.CATERING]: 'Catering',
  [ServiceGroup.SPACE_MAIL]: 'Space & Mail',
  [ServiceGroup.ENERGY]: 'Energy',
  [ServiceGroup.COMPLIANCE]: 'Compliance & HSE',
  [ServiceGroup.ASSET_LIFECYCLE]: 'Asset Lifecycle',
};

/** Service groups that belong to each pillar (used to filter the group picker). */
export const PILLAR_GROUPS: Record<ServicePillar, ServiceGroup[]> = {
  [ServicePillar.HARD]: [
    ServiceGroup.HVAC, ServiceGroup.ELECTRICAL, ServiceGroup.PLUMBING, ServiceGroup.BUILDING_AUTOMATION,
    ServiceGroup.STRUCTURAL, ServiceGroup.FIRE_SAFETY, ServiceGroup.VERTICAL_TRANSPORT,
  ],
  [ServicePillar.SOFT]: [
    ServiceGroup.CLEANING, ServiceGroup.WASTE, ServiceGroup.SECURITY, ServiceGroup.GROUNDS,
    ServiceGroup.CATERING, ServiceGroup.SPACE_MAIL,
  ],
  [ServicePillar.STRATEGIC]: [ServiceGroup.ENERGY, ServiceGroup.COMPLIANCE, ServiceGroup.ASSET_LIFECYCLE],
};

export const formatLkr = (value?: number | null): string =>
  value === null || value === undefined ? '—' : `LKR ${value.toLocaleString('en-LK')}`;

export interface CatalogService {
  id: string;
  serviceName: string;
  pillarCategory: ServicePillar;
  serviceGroup?: ServiceGroup | null;
  description?: string | null;
  icon?: string | null;
  requiresQuote: boolean;
  basePrice?: number | null;
  requiredSubscriptionTier: SubscriptionTier;
  sortOrder: number;
  status: string;
}

export interface SubscriptionPlan {
  id: string;
  tierName: SubscriptionTier;
  targetFacility: string;
  targetCustomer?: string | null;
  monthlyFeeLkr?: number | null;
  annualFeeLkr?: number | null;
  isCustomPriced: boolean;
  includedVisitsPerMonth?: number | null;
  includedLabourHoursPerMonth?: number | null;
  labourDiscountPct: number;
  inspectionCadence: 'NONE' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  callOutWaived: boolean;
  includedServices?: string | null;
  activeAccounts: number;
  status: string;
}
