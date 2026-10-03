import { ServicePillar, ServiceGroup, SubscriptionTier, FacilityType } from '@metro-fix/core-types';
import type { InspectionCadence } from '@metro-fix/core-types';

/** Subscription plans from "MetroFix – Subscription & Commercial Policy" (indicative launch prices, LKR). */
export interface PlanSeed {
  tierName: SubscriptionTier;
  targetFacility: FacilityType;
  targetCustomer: string;
  monthlyFeeLkr: number | null;
  annualFeeLkr: number | null;
  isCustomPriced: boolean;
  includedVisitsPerMonth: number | null;
  includedLabourHoursPerMonth: number | null;
  labourDiscountPct: number;
  inspectionCadence: InspectionCadence;
  callOutWaived: boolean;
  includedServices: string;
}

export const PLAN_SEEDS: PlanSeed[] = [
  {
    tierName: SubscriptionTier.ACCESS,
    targetFacility: FacilityType.RESIDENTIAL,
    targetCustomer: 'Occasional residential / small users',
    monthlyFeeLkr: 1500,
    annualFeeLkr: 15000,
    isCustomPriced: false,
    includedVisitsPerMonth: 0,
    includedLabourHoursPerMonth: 0,
    labourDiscountPct: 5,
    inspectionCadence: 'NONE',
    callOutWaived: false,
    includedServices:
      '24/7 platform access; verified technicians; digital service history and reminders; standard priority; ~5% labour discount',
  },
  {
    tierName: SubscriptionTier.ESSENTIAL,
    targetFacility: FacilityType.RESIDENTIAL,
    targetCustomer: 'Homes and small offices',
    monthlyFeeLkr: 3500,
    annualFeeLkr: 35000,
    isCustomPriced: false,
    includedVisitsPerMonth: 1,
    includedLabourHoursPerMonth: 1,
    labourDiscountPct: 10,
    inspectionCadence: 'ANNUAL',
    callOutWaived: true,
    includedServices:
      'Priority technician allocation; 1 visit and 1 labour hour per month; ~10% extra labour discount; no call-out charge; annual basic inspection',
  },
  {
    tierName: SubscriptionTier.PLUS,
    targetFacility: FacilityType.COMMERCIAL,
    targetCustomer: 'Larger homes, villas and SMEs',
    monthlyFeeLkr: 7500,
    annualFeeLkr: 75000,
    isCustomPriced: false,
    includedVisitsPerMonth: 2,
    includedLabourHoursPerMonth: 3,
    labourDiscountPct: 15,
    inspectionCadence: 'QUARTERLY',
    callOutWaived: true,
    includedServices:
      'High-priority allocation; 2 visits and 3 labour hours per month; ~15% extra labour discount; no call-out charge; quarterly inspection; annual facility condition report',
  },
  {
    tierName: SubscriptionTier.BUSINESS,
    targetFacility: FacilityType.COMMERCIAL,
    targetCustomer: 'Commercial properties (SLA-based, custom priced from LKR 15,000/month)',
    monthlyFeeLkr: 15000,
    annualFeeLkr: null,
    isCustomPriced: true,
    includedVisitsPerMonth: null,
    includedLabourHoursPerMonth: null,
    labourDiscountPct: 0,
    inspectionCadence: 'MONTHLY',
    callOutWaived: true,
    includedServices:
      'Priority dispatch; dedicated account coordination; monthly inspection and PPM planning; digital asset register; monthly reporting and SLA targets',
  },
];

/** Customer-facing catalog: pillar -> group, with a friendly description and icon (Ionicons/Feather-style names). */
export interface CatalogSeed {
  serviceName: string;
  pillarCategory: ServicePillar;
  serviceGroup: ServiceGroup;
  description: string;
  icon: string;
  requiresQuote: boolean;
  requiredSubscriptionTier: SubscriptionTier;
  sortOrder: number;
}

const hard = ServicePillar.HARD;
const soft = ServicePillar.SOFT;
const strat = ServicePillar.STRATEGIC;
const T = SubscriptionTier;

export const CATALOG_SEEDS: CatalogSeed[] = [
  // Hard Facility Services (Building Fabric & Machinery)
  { serviceName: 'HVAC Systems', pillarCategory: hard, serviceGroup: ServiceGroup.HVAC, icon: 'thermometer', requiresQuote: false, requiredSubscriptionTier: T.ACCESS, sortOrder: 10,
    description: 'Maintenance of boilers, chillers, air handling units, ventilation systems and ductwork cleaning.' },
  { serviceName: 'Electrical Systems', pillarCategory: hard, serviceGroup: ServiceGroup.ELECTRICAL, icon: 'zap', requiresQuote: false, requiredSubscriptionTier: T.ACCESS, sortOrder: 20,
    description: 'Servicing switchgear, transformers, backup generators, emergency lighting and distribution boards.' },
  { serviceName: 'Plumbing & Water', pillarCategory: hard, serviceGroup: ServiceGroup.PLUMBING, icon: 'droplet', requiresQuote: false, requiredSubscriptionTier: T.ACCESS, sortOrder: 30,
    description: 'Water treatment, pipe leaks, backflow prevention, drainage systems and restroom fixtures.' },
  { serviceName: 'Building Automation (BMS)', pillarCategory: hard, serviceGroup: ServiceGroup.BUILDING_AUTOMATION, icon: 'cpu', requiresQuote: true, requiredSubscriptionTier: T.PLUS, sortOrder: 40,
    description: 'Calibrating smart thermostats, lighting control systems and energy management software.' },
  { serviceName: 'Structural Maintenance', pillarCategory: hard, serviceGroup: ServiceGroup.STRUCTURAL, icon: 'home', requiresQuote: false, requiredSubscriptionTier: T.ACCESS, sortOrder: 50,
    description: 'Repairing roofs, masonry, flooring, drywall and painting; servicing automatic doors and docks.' },
  { serviceName: 'Fire Safety Systems', pillarCategory: hard, serviceGroup: ServiceGroup.FIRE_SAFETY, icon: 'alert-triangle', requiresQuote: true, requiredSubscriptionTier: T.ESSENTIAL, sortOrder: 60,
    description: 'Inspecting and testing fire alarms, smoke detectors, sprinkler systems and fire extinguishers.' },
  { serviceName: 'Vertical Transportation', pillarCategory: hard, serviceGroup: ServiceGroup.VERTICAL_TRANSPORT, icon: 'arrow-up', requiresQuote: true, requiredSubscriptionTier: T.PLUS, sortOrder: 70,
    description: 'Routine safety certification, cable tension checks and mechanical repair of elevators and escalators.' },

  // Soft Facility Services (Operations & Workplace Comfort)
  { serviceName: 'Janitorial & Cleaning', pillarCategory: soft, serviceGroup: ServiceGroup.CLEANING, icon: 'wind', requiresQuote: false, requiredSubscriptionTier: T.ACCESS, sortOrder: 110,
    description: 'Daily office dusting, floor buffing, window washing, carpet deep-cleaning and sanitization.' },
  { serviceName: 'Waste Management', pillarCategory: soft, serviceGroup: ServiceGroup.WASTE, icon: 'trash-2', requiresQuote: true, requiredSubscriptionTier: T.ESSENTIAL, sortOrder: 120,
    description: 'Trash collection, electronic waste disposal, recycling programs and hazardous waste removal.' },
  { serviceName: 'Security Services', pillarCategory: soft, serviceGroup: ServiceGroup.SECURITY, icon: 'shield', requiresQuote: true, requiredSubscriptionTier: T.PLUS, sortOrder: 130,
    description: 'Manning reception desks, patrolling property, monitoring CCTV and managing badge access control systems.' },
  { serviceName: 'Groundskeeping & Landscaping', pillarCategory: soft, serviceGroup: ServiceGroup.GROUNDS, icon: 'sun', requiresQuote: false, requiredSubscriptionTier: T.ESSENTIAL, sortOrder: 140,
    description: 'Mowing lawns, maintaining indoor plants, tree trimming, and winter snow or ice removal.' },
  { serviceName: 'Catering & Hospitality', pillarCategory: soft, serviceGroup: ServiceGroup.CATERING, icon: 'coffee', requiresQuote: true, requiredSubscriptionTier: T.PLUS, sortOrder: 150,
    description: 'Managing executive cafeterias, office coffee stations, vending machines and event catering logistics.' },
  { serviceName: 'Space & Mail Management', pillarCategory: soft, serviceGroup: ServiceGroup.SPACE_MAIL, icon: 'package', requiresQuote: true, requiredSubscriptionTier: T.PLUS, sortOrder: 160,
    description: 'Internal office moves, furniture assembly, mailroom sorting and courier deliveries.' },

  // Strategic Facility Management
  { serviceName: 'Energy Management', pillarCategory: strat, serviceGroup: ServiceGroup.ENERGY, icon: 'battery-charging', requiresQuote: true, requiredSubscriptionTier: T.PLUS, sortOrder: 210,
    description: 'Carbon footprint audits, solar panel tracking and LED retrofitting to cut costs.' },
  { serviceName: 'Compliance & HSE', pillarCategory: strat, serviceGroup: ServiceGroup.COMPLIANCE, icon: 'clipboard', requiresQuote: true, requiredSubscriptionTier: T.BUSINESS, sortOrder: 220,
    description: 'Keeping records for health, safety and environmental laws to avoid fines and liability.' },
  { serviceName: 'Asset Lifecycle Tracking', pillarCategory: strat, serviceGroup: ServiceGroup.ASSET_LIFECYCLE, icon: 'bar-chart-2', requiresQuote: true, requiredSubscriptionTier: T.BUSINESS, sortOrder: 230,
    description: 'Budgeting for future capital expenditure, such as when a roof or chiller needs total replacement.' },
];
