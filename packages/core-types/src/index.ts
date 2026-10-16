import { z } from 'zod';

// ==========================================
// Core Domain Enums
// ==========================================

export enum JobStatus {
  REQUESTED = 'REQUESTED',
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  ASSIGNED = 'ASSIGNED',
  ON_ROUTE = 'ON_ROUTE',
  INSPECTION = 'INSPECTION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',

  // Backward-compatibility aliases
  Requested = 'REQUESTED',
  PendingAcceptance = 'PENDING_ACCEPTANCE',
  Assigned = 'ASSIGNED',
  OnRoute = 'ON_ROUTE',
  Inspection = 'INSPECTION',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Closed = 'CLOSED',
  Cancelled = 'CANCELLED',
}

// ==========================================
// Job lifecycle (single source of truth)
// ==========================================
//
// The API enforces these rules; the web board and the mobile apps read the same definitions for
// column order, progress steppers, filters and drag/drop validation, so a change here reaches
// every app.
//
//   REQUESTED -> PENDING_ACCEPTANCE -> ASSIGNED -> ON_ROUTE -> INSPECTION -> IN_PROGRESS
//                                                                   -> COMPLETED -> CLOSED
//
// PENDING_ACCEPTANCE means "offered to one worker, awaiting their answer". An offer that is
// declined, withdrawn or left unanswered for OFFER_TIMEOUT_SECONDS returns to REQUESTED.
// A worker who rejects after accepting (ASSIGNED / INSPECTION) also returns the job to REQUESTED.
// CANCELLED can be reached from any state before work starts (IN_PROGRESS).

/** The normal path of a job, in order. CANCELLED sits outside it. */
export const JOB_STAGES: readonly JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.PENDING_ACCEPTANCE,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.CLOSED,
];

/** Every status in display order: the normal path, then CANCELLED. */
export const JOB_STATUSES_IN_ORDER: readonly JobStatus[] = [...JOB_STAGES, JobStatus.CANCELLED];

/** Which status a job may move to from each status. An absent target is not allowed. */
export const JOB_TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  [JobStatus.REQUESTED]: [JobStatus.PENDING_ACCEPTANCE, JobStatus.CANCELLED],
  // ASSIGNED = accepted; REQUESTED = declined, expired or withdrawn.
  [JobStatus.PENDING_ACCEPTANCE]: [JobStatus.ASSIGNED, JobStatus.REQUESTED, JobStatus.CANCELLED],
  // REQUESTED = the worker rejects the job after accepting it.
  [JobStatus.ASSIGNED]: [JobStatus.ON_ROUTE, JobStatus.REQUESTED, JobStatus.CANCELLED],
  [JobStatus.ON_ROUTE]: [JobStatus.INSPECTION, JobStatus.CANCELLED],
  [JobStatus.INSPECTION]: [JobStatus.IN_PROGRESS, JobStatus.REQUESTED, JobStatus.CANCELLED],
  [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
  [JobStatus.COMPLETED]: [JobStatus.CLOSED],
  [JobStatus.CLOSED]: [],
  [JobStatus.CANCELLED]: [],
};

/** How long a worker has to answer an offer before it returns to the dispatch queue. */
export const OFFER_TIMEOUT_SECONDS = 9 * 60 * 60;

/** Clock text for a number of seconds: m:ss under an hour, h:mm:ss from an hour up. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const seconds = String(safe % 60).padStart(2, '0');
  if (safe >= 3600) {
    return `${Math.floor(safe / 3600)}:${String(Math.floor((safe % 3600) / 60)).padStart(2, '0')}:${seconds}`;
  }
  return `${Math.floor(safe / 60)}:${seconds}`;
}

/** Plain-words length of the offer window, e.g. "9 hours" or "90 seconds". */
export function describeOfferTimeout(totalSeconds: number = OFFER_TIMEOUT_SECONDS): string {
  if (totalSeconds % 3600 === 0) {
    const hours = totalSeconds / 3600;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  if (totalSeconds % 60 === 0) {
    const minutes = totalSeconds / 60;
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${totalSeconds} seconds`;
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

/** No further transitions are possible. */
export function isTerminalStatus(status: JobStatus): boolean {
  return (JOB_TRANSITIONS[status]?.length ?? 0) === 0;
}

/** Finished one way or another: completed, closed or cancelled. */
export function isFinishedStatus(status: JobStatus): boolean {
  return (
    status === JobStatus.COMPLETED ||
    status === JobStatus.CLOSED ||
    status === JobStatus.CANCELLED
  );
}

/** The job can still be cancelled. */
export function isCancellableStatus(status: JobStatus): boolean {
  return canTransition(status, JobStatus.CANCELLED);
}

/** 1-based position on the normal path (e.g. for "Stage 3 of 8"), or 0 for CANCELLED / unknown. */
export function stageNumber(status: JobStatus): number {
  return JOB_STAGES.indexOf(status) + 1;
}

/** Why an offer went back to the dispatch queue, or why a job came back after being accepted. */
export type JobOfferOutcome = 'DECLINED' | 'EXPIRED' | 'REJECTED' | 'WITHDRAWN';

export interface JobOfferRecord {
  workerId: string;
  outcome: JobOfferOutcome;
  reason?: string | null;
  /** ISO timestamp. */
  at: string;
}

export enum FacilityType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',

  // Backward-compatibility aliases
  Residential = 'RESIDENTIAL',
  Commercial = 'COMMERCIAL',
  Industrial = 'INDUSTRIAL',
}

export enum ServicePillar {
  HARD = 'HARD',
  SOFT = 'SOFT',
  STRATEGIC = 'STRATEGIC',

  // Backward-compatibility aliases
  Hard = 'HARD',
  Soft = 'SOFT',
  Strategic = 'STRATEGIC',
}

// Backwards compatibility alias
export { ServicePillar as ServiceType };

export enum SubscriptionTier {
  ACCESS = 'ACCESS',
  ESSENTIAL = 'ESSENTIAL',
  PLUS = 'PLUS',
  BUSINESS = 'BUSINESS',

  // Backward-compatibility aliases
  Access = 'ACCESS',
  Essential = 'ESSENTIAL',
  Plus = 'PLUS',
  Business = 'BUSINESS',
}

export enum ServiceGroup {
  // Hard facility services
  HVAC = 'HVAC',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  BUILDING_AUTOMATION = 'BUILDING_AUTOMATION',
  STRUCTURAL = 'STRUCTURAL',
  FIRE_SAFETY = 'FIRE_SAFETY',
  VERTICAL_TRANSPORT = 'VERTICAL_TRANSPORT',
  // Soft facility services
  CLEANING = 'CLEANING',
  WASTE = 'WASTE',
  SECURITY = 'SECURITY',
  GROUNDS = 'GROUNDS',
  CATERING = 'CATERING',
  SPACE_MAIL = 'SPACE_MAIL',
  // Strategic facility management
  ENERGY = 'ENERGY',
  COMPLIANCE = 'COMPLIANCE',
  ASSET_LIFECYCLE = 'ASSET_LIFECYCLE',
}

export type InspectionCadence = 'NONE' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER_CARE = 'CUSTOMER_CARE',
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',

  // Backward-compatibility aliases
  Admin = 'ADMIN',
  CustomerCare = 'CUSTOMER_CARE',
  Customer = 'CUSTOMER',
  Worker = 'WORKER',
}

// ==========================================
// Location / Spatial Schemas
// ==========================================

export const locationCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type LocationCoordinates = z.infer<typeof locationCoordinatesSchema>;

// ==========================================
// Core Entity Schemas & Types
// ==========================================

// Base User Schema
export const userSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.nativeEnum(Role),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  pushToken: z.string().optional().nullable(),
  /** True while the account still has an admin-issued one-time password (workers). */
  mustChangePassword: z.boolean().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type User = z.infer<typeof userSchema>;

// Worker Schema (Extends User with internal rating 1-5, location, pillars, status)
export const workerSchema = userSchema.extend({
  rating: z.number().min(1).max(5).default(5),
  location: locationCoordinatesSchema.optional(),
  servicePillars: z.array(z.nativeEnum(ServicePillar)).default([]),
  isAvailable: z.boolean().default(true),
  activeJobs: z.number().int().nonnegative().default(0),
});

export type Worker = z.infer<typeof workerSchema>;

// Customer Schema (Extends User with facility type and subscription tier)
export const customerSchema = userSchema.extend({
  facilityType: z.nativeEnum(FacilityType),
  subscriptionTier: z.nativeEnum(SubscriptionTier).nullable().optional(),
  facilityLocation: locationCoordinatesSchema.optional(),
});

export type Customer = z.infer<typeof customerSchema>;

// Service Request Schema (Core Job Ticket)
export const serviceRequestSchema = z.object({
  id: z.string(),
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(5, 'Description is required.'),
  servicePillar: z.nativeEnum(ServicePillar),
  facilityType: z.nativeEnum(FacilityType),
  status: z.nativeEnum(JobStatus).default(JobStatus.REQUESTED),
  customerId: z.string(),
  workerId: z.string().optional().nullable(),
  location: locationCoordinatesSchema,
  scheduledFor: z.union([z.string(), z.date()]).optional().nullable(),
  quoteAmount: z.number().nonnegative().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
  quoteNotes: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  urgency: z.string().optional(),
  /** When the current offer was made / when it lapses (only while PENDING_ACCEPTANCE). */
  offeredAt: z.union([z.string(), z.date()]).optional().nullable(),
  offerExpiresAt: z.union([z.string(), z.date()]).optional().nullable(),
  rejectReason: z.string().optional().nullable(),
  cancelReason: z.string().optional().nullable(),
  cancelledAt: z.union([z.string(), z.date()]).optional().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

/** The customer or worker attached to a job, as the API returns it (password is never included). */
export interface JobParty {
  id: string;
  userId?: string;
  rating?: number;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string | null;
  };
}

export type ServiceRequest = z.infer<typeof serviceRequestSchema> & {
  customer?: JobParty | null;
  worker?: JobParty | null;
  /** Everyone this job was offered to and what they answered. */
  offerHistory?: JobOfferRecord[] | null;
  /** Itemised estimate / final for invoicing; absent on jobs quoted before job cards existed. */
  jobCard?: JobCard | null;
};

// Worker Job Queue Response DTO
export interface WorkerJobQueueResponse {
  jobs: ServiceRequest[];
  total: number;
}

// Push Token DTO
export const registerPushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required.'),
});

export type RegisterPushTokenDto = z.infer<typeof registerPushTokenSchema>;

// Worker Location Telemetry DTO
export const updateWorkerLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
});

export type UpdateWorkerLocationDto = z.infer<typeof updateWorkerLocationSchema>;

// ==========================================
// Job card (quote now, confirmed at completion, basis for the invoice)
// ==========================================

export type JobCardLineKind = 'LABOUR' | 'MATERIAL' | 'OTHER';

export interface JobCardLineItem {
  id: string;
  kind: JobCardLineKind;
  description: string;
  /** Hours for labour, units for materials. */
  quantity: number;
  unitPrice: number;
}

/** One priced version of the work: the estimate made at inspection, or the final confirmed at completion. */
export interface JobCardSection {
  lineItems: JobCardLineItem[];
  /** Total labour time in hours (the schedule estimate, or the time actually spent). */
  hours: number;
  notes: string;
  subtotal: number;
  tax: number;
  total: number;
  savedAt: string;
  /** User id of whoever last saved this section. */
  savedBy?: string | null;
}

export interface JobCard {
  currency: string;
  /** Tax as a percentage, e.g. 8 for 8%. */
  taxRate: number;
  estimate: JobCardSection;
  /** Confirmed values at completion; the invoice uses this, falling back to the estimate. */
  final?: JobCardSection | null;
}

export const JOB_CARD_CURRENCY = 'LKR';

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Line total, never negative or NaN. */
export function jobCardLineTotal(item: Pick<JobCardLineItem, 'quantity' | 'unitPrice'>): number {
  const quantity = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? Math.max(0, item.unitPrice) : 0;
  return roundMoney(quantity * unitPrice);
}

/** Subtotal, tax and total for a set of lines. The API recomputes these; clients use it for live totals. */
export function computeJobCardTotals(
  lineItems: readonly Pick<JobCardLineItem, 'quantity' | 'unitPrice'>[],
  taxRate: number = 0,
): { subtotal: number; tax: number; total: number } {
  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + jobCardLineTotal(item), 0));
  const rate = Number.isFinite(taxRate) ? Math.max(0, taxRate) : 0;
  const tax = roundMoney((subtotal * rate) / 100);
  return { subtotal, tax, total: roundMoney(subtotal + tax) };
}

/** The section that counts for billing: the confirmed final if there is one, otherwise the estimate. */
export function jobCardBillable(card: JobCard | null | undefined): JobCardSection | null {
  if (!card) return null;
  return card.final ?? card.estimate ?? null;
}

// ==========================================
// Customer subscription & (demo) card payment
// ==========================================

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

/** Error code the API sends when a customer without a paid plan tries to raise a request. */
export const SUBSCRIPTION_REQUIRED_CODE = 'SUBSCRIPTION_REQUIRED';

export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'UNKNOWN';

export interface SubscriptionPaymentRecord {
  id: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amountLkr: number;
  cardBrand: CardBrand;
  cardLast4: string;
  status: 'SUCCEEDED' | 'DECLINED';
  reference: string;
  createdAt: string;
}

/** A customer's own subscription as `GET /subscriptions/me` returns it. `tier` is null until they pick a plan. */
export interface CustomerSubscription {
  tier: SubscriptionTier | null;
  billingCycle: BillingCycle | null;
  subscribedAt: string | null;
  address: string | null;
  payments: SubscriptionPaymentRecord[];
}

export interface DemoCardInput {
  number: string;
  name: string;
  /** MM/YY */
  expiry: string;
  cvc: string;
}

export interface CheckoutInput {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  card: DemoCardInput;
}

/** Card number with spaces / dashes removed. */
export const cardDigits = (value: string): string => value.replace(/\D/g, '');

export function detectCardBrand(value: string): CardBrand {
  const digits = cardDigits(value);
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return 'UNKNOWN';
}

/** Luhn check, the checksum every real card number satisfies. */
export function isValidCardNumber(value: string): boolean {
  const digits = cardDigits(value);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** `MM/YY` that is a real month and not already past. */
export function isValidCardExpiry(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // A card is good through the last day of its expiry month.
  return new Date(year, month, 1).getTime() > now.getTime();
}

export const isValidCardCvc = (value: string, brand: CardBrand = 'UNKNOWN'): boolean =>
  new RegExp(brand === 'AMEX' ? '^\\d{4}$' : '^\\d{3,4}$').test(value.trim());

/** Groups digits as the card shows them: 4-4-4-4 (4-6-5 for Amex). */
export function formatCardNumber(value: string): string {
  const digits = cardDigits(value).slice(0, 19);
  if (detectCardBrand(digits) === 'AMEX') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ');
  }
  return (digits.match(/.{1,4}/g) ?? []).join(' ');
}

/** Turns typing into `MM/YY`, adding the slash by itself. */
export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Monthly price for a billing cycle (annual is shown per month for comparison). */
export function planPriceFor(
  plan: { monthlyFeeLkr?: number | null; annualFeeLkr?: number | null },
  cycle: BillingCycle,
): number | null {
  if (cycle === 'ANNUAL') return plan.annualFeeLkr ?? null;
  return plan.monthlyFeeLkr ?? null;
}

/**
 * A short, stable reference for display ("TICKET #K3F9Q2") derived from the whole id.
 *
 * Do not use the tail of the id: SQL Server's sequential GUIDs share their last 12 characters, so
 * every ticket would read the same. Display convenience only; a proper sequential ticket number
 * should come from the backend, and this can then be retired.
 */
export function ticketRef(id: string | null | undefined, length = 6): string {
  if (!id) return '';
  // FNV-1a over the full id.
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(length, '0').slice(-length);
}

// ==========================================
// Application settings (edited by admins under Settings)
// ==========================================

export interface AppSettings {
  company: {
    name: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    /** IANA time zone, e.g. "Asia/Colombo". */
    timezone: string;
    /** Printed on invoices and exports. */
    taxRegistrationNo: string;
  };
  dispatch: {
    /** How long a worker has to answer an offer before it returns to the queue. */
    offerTimeoutHours: number;
    /** Accepted unfinished jobs a worker can hold before dispatch treats them as at capacity. */
    maxActiveJobs: number;
    /** Dispatch score = rating x ratingWeight - distanceKm x proximityWeight. */
    proximityWeight: number;
    ratingWeight: number;
    /** Search radius for the worker picker when none is given (0 = no limit). */
    defaultRadiusKm: number;
  };
  billing: {
    invoicePrefix: string;
    /** Tax added to a job card when the worker does not set one, in percent (e.g. 18 for VAT). */
    defaultTaxRatePct: number;
    /** Pre-filled hourly rate for labour lines on a new job card, in LKR. */
    defaultLabourRateLkr: number;
    paymentTermsDays: number;
  };
  requests: {
    /** Customers need a paid plan before they can raise a request. */
    requirePlanToRequest: boolean;
    /** Customers may cancel their own requests before work starts. */
    allowCustomerCancellation: boolean;
  };
  security: {
    passwordMinLength: number;
    /** Wrong passwords before an account is locked (0 turns lockout off). */
    maxFailedLogins: number;
    lockoutMinutes: number;
  };
}

export type AppSettingsPatch = { [K in keyof AppSettings]?: Partial<AppSettings[K]> };

export const DEFAULT_APP_SETTINGS: AppSettings = {
  company: {
    name: 'METRO-FIX',
    supportEmail: 'support@metro-fix.com',
    supportPhone: '',
    address: '',
    timezone: 'Asia/Colombo',
    taxRegistrationNo: '',
  },
  dispatch: {
    offerTimeoutHours: OFFER_TIMEOUT_SECONDS / 3600,
    maxActiveJobs: 5,
    proximityWeight: 1,
    ratingWeight: 20,
    defaultRadiusKm: 50,
  },
  billing: { invoicePrefix: 'INV-', defaultTaxRatePct: 0, defaultLabourRateLkr: 2500, paymentTermsDays: 14 },
  requests: { requirePlanToRequest: true, allowCustomerCancellation: true },
  security: { passwordMinLength: 8, maxFailedLogins: 5, lockoutMinutes: 15 },
};

/** The slice of settings every signed-in app may read (and the login screen, before sign-in, a smaller part). */
export interface PublicAppSettings {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  passwordMinLength: number;
}

export interface SignedInAppSettings extends PublicAppSettings {
  currency: 'LKR';
  offerTimeoutHours: number;
  defaultTaxRatePct: number;
  defaultLabourRateLkr: number;
  allowCustomerCancellation: boolean;
  requirePlanToRequest: boolean;
}

export const SETTINGS_TIMEZONES = [
  'Asia/Colombo',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'UTC',
] as const;

/** Applies a partial settings object over a base, section by section. Unknown keys are ignored. */
export function mergeAppSettings(base: AppSettings, patch: AppSettingsPatch | null | undefined): AppSettings {
  const next = JSON.parse(JSON.stringify(base)) as AppSettings;
  if (!patch) return next;
  for (const section of Object.keys(next) as (keyof AppSettings)[]) {
    const incoming = patch[section] as Record<string, unknown> | undefined;
    if (!incoming) continue;
    for (const key of Object.keys(next[section])) {
      if (incoming[key] !== undefined) (next[section] as Record<string, unknown>)[key] = incoming[key];
    }
  }
  return next;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Problems with a full settings object, keyed by "section.field". Empty means valid. */
export function validateAppSettings(s: AppSettings): Record<string, string> {
  const errors: Record<string, string> = {};
  const num = (path: string, value: unknown, min: number, max: number, label: string, integer = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
      errors[path] = `${label} must be ${integer ? 'a whole number ' : 'a number '}from ${min} to ${max}.`;
    }
  };
  if (!s.company.name.trim()) errors['company.name'] = 'Enter the company name.';
  if (s.company.name.length > 120) errors['company.name'] = 'Keep the company name under 120 characters.';
  if (!EMAIL_PATTERN.test(s.company.supportEmail)) errors['company.supportEmail'] = 'Enter a valid support email.';
  if (s.company.supportPhone && (s.company.supportPhone.match(/\d/g) ?? []).length < 7) {
    errors['company.supportPhone'] = 'Enter a valid support phone number.';
  }
  if (s.company.address.length > 300) errors['company.address'] = 'Keep the address under 300 characters.';
  if (!(SETTINGS_TIMEZONES as readonly string[]).includes(s.company.timezone)) errors['company.timezone'] = 'Pick a supported time zone.';
  if (s.company.taxRegistrationNo.length > 40) errors['company.taxRegistrationNo'] = 'Keep the registration number under 40 characters.';

  num('dispatch.offerTimeoutHours', s.dispatch.offerTimeoutHours, 0.25, 72, 'The offer window');
  num('dispatch.maxActiveJobs', s.dispatch.maxActiveJobs, 1, 50, 'Max active jobs', true);
  num('dispatch.proximityWeight', s.dispatch.proximityWeight, 0, 100, 'Proximity weight');
  num('dispatch.ratingWeight', s.dispatch.ratingWeight, 0, 100, 'Rating weight');
  if (!errors['dispatch.proximityWeight'] && !errors['dispatch.ratingWeight'] && s.dispatch.proximityWeight + s.dispatch.ratingWeight === 0) {
    errors['dispatch.ratingWeight'] = 'At least one weight must be above zero.';
  }
  num('dispatch.defaultRadiusKm', s.dispatch.defaultRadiusKm, 0, 500, 'The search radius');

  if (!/^[A-Za-z0-9-]{0,12}$/.test(s.billing.invoicePrefix)) errors['billing.invoicePrefix'] = 'Use up to 12 letters, digits or dashes.';
  num('billing.defaultTaxRatePct', s.billing.defaultTaxRatePct, 0, 100, 'The tax rate');
  num('billing.defaultLabourRateLkr', s.billing.defaultLabourRateLkr, 0, 1000000, 'The labour rate');
  num('billing.paymentTermsDays', s.billing.paymentTermsDays, 0, 365, 'Payment terms', true);

  num('security.passwordMinLength', s.security.passwordMinLength, 6, 64, 'Minimum password length', true);
  num('security.maxFailedLogins', s.security.maxFailedLogins, 0, 20, 'Failed sign-ins before lockout', true);
  num('security.lockoutMinutes', s.security.lockoutMinutes, 1, 1440, 'Lockout time', true);
  return errors;
}

/** Why a password is not acceptable under the current policy, or null if it is. */
export function passwordPolicyProblem(password: string, minLength: number): string | null {
  if (password.length < minLength) return `Use at least ${minLength} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include both letters and numbers.';
  return null;
}

// ==========================================
// Hosting: which website a hostname is, and where its API is
// ==========================================

/** Which audience a website address serves. `any` is local development (plain localhost or an IP). */
export type Surface = 'admin' | 'customer' | 'any';

export interface HostingConfig {
  /** The first label that marks the staff site, e.g. "admin" in admin.example.lk. Default "admin". */
  adminLabel?: string;
  /** Forces the audience regardless of the address (set at build time for unusual hosting). */
  surface?: Surface;
  /** Full API address; when set it wins over everything else. */
  apiBase?: string;
}

const DEFAULT_ADMIN_LABEL = 'admin';
const API_LABEL = 'api';
const LOCAL_API_PORT = 3000;

const isIpAddress = (hostname: string): boolean => /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');

/** True for plain `localhost`, an IP address or a single-word host such as a docker service name. */
function isPlainHost(hostname: string): boolean {
  return hostname === 'localhost' || isIpAddress(hostname) || !hostname.includes('.');
}

/**
 * The audience for an address, from its first label: `admin.<anything>` is the staff site, any other
 * real hostname (`metrofix.example.lk`, `metrofix.localhost`) is the customer site, and plain
 * localhost / IPs serve both so development keeps working. Nothing here names a real domain.
 */
export function detectSurface(hostname: string, config: HostingConfig = {}): Surface {
  if (config.surface) return config.surface;
  const host = hostname.toLowerCase();
  if (isPlainHost(host)) return 'any';
  const adminLabel = (config.adminLabel || DEFAULT_ADMIN_LABEL).toLowerCase();
  return host.split('.')[0] === adminLabel ? 'admin' : 'customer';
}

/** The same site's address for the other audience (adds or drops the admin label), keeping the port. */
export function counterpartHost(host: string, target: 'admin' | 'customer', config: HostingConfig = {}): string | null {
  const adminLabel = (config.adminLabel || DEFAULT_ADMIN_LABEL).toLowerCase();
  const [name, port] = host.split(':');
  if (isPlainHost(name.toLowerCase())) return null;
  const labels = name.split('.');
  const isAdmin = labels[0].toLowerCase() === adminLabel;
  if (target === 'admin') return `${isAdmin ? name : `${adminLabel}.${name}`}${port ? `:${port}` : ''}`;
  return isAdmin ? `${labels.slice(1).join('.')}${port ? `:${port}` : ''}` : host;
}

/**
 * Where the API lives for a page address. An explicit `apiBase` wins. On localhost and IPs it is
 * port 3000 of the same machine. Elsewhere it is `api.` in place of the admin label (or in front of
 * the customer hostname): metrofix.example.lk and admin.metrofix.example.lk both use api.metrofix.example.lk.
 */
export function resolveApiBase(
  location: { protocol: string; hostname: string; port?: string },
  config: HostingConfig = {},
): string {
  if (config.apiBase) return config.apiBase.replace(/\/+$/, '');
  const host = location.hostname.toLowerCase();
  if (isPlainHost(host) || host.endsWith('.localhost')) return `${location.protocol}//${host === 'localhost' || isIpAddress(host) ? host : 'localhost'}:${LOCAL_API_PORT}`;
  const adminLabel = (config.adminLabel || DEFAULT_ADMIN_LABEL).toLowerCase();
  const labels = host.split('.');
  const base = labels[0] === adminLabel ? labels.slice(1) : labels;
  return `${location.protocol}//${[API_LABEL, ...base].join('.')}`;
}

/** Whether a role belongs on a website: staff on the admin site, customers on the customer site. */
export function surfaceAllowsRole(surface: Surface, role: string): boolean {
  if (surface === 'any') return true;
  const isStaff = role === Role.ADMIN || role === Role.CUSTOMER_CARE;
  return surface === 'admin' ? isStaff : role === Role.CUSTOMER;
}

// Job Quote DTO (worker estimate submission)
export const submitJobQuoteSchema = z.object({
  estimatedCost: z.number().nonnegative('Cost must be 0 or greater'),
  estimatedHours: z.number().nonnegative('Hours must be 0 or greater'),
  notes: z.string().default(''),
});

export type SubmitJobQuoteDto = z.infer<typeof submitJobQuoteSchema>;

// Job Proof DTO (signature and photo proof submission)
export const submitJobProofSchema = z.object({
  signature: z.string().min(10, 'Signature is required'),
  photos: z.array(z.string()).default([]),
});

export type SubmitJobProofDto = z.infer<typeof submitJobProofSchema>;

// ==========================================
// Auth & Form Schemas
// ==========================================

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  // Sign-in only needs *a* password: the length rule applies when one is set (Settings > Security), and
  // checking it here would lock out people whose password predates a change to that rule.
  password: z.string().min(1, 'Enter your password.'),
});

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required.'),
    email: z.string().trim().email('Enter a valid email address.'),
    phoneNumber: z.string().trim().min(7, 'Enter a valid phone number.').optional().or(z.literal('')),
    role: z.nativeEnum(Role).default(Role.CUSTOMER),
    // The real minimum is set under Settings > Security; the form and the API both check it.
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string().min(6, 'Confirm the password.'),
    companyName: z.string().trim().min(2, 'Company name is required.').optional().or(z.literal('')),
    acceptTerms: z.boolean().refine((value) => value, {
      message: 'Accept the terms to continue.',
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;