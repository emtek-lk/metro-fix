import { z } from 'zod';

// Shape only; ranges and cross-field rules are checked by validateAppSettings in core-types so the
// admin form and the API agree. Unknown keys are dropped, so a typo cannot create a setting.
export const updateSettingsSchema = z
  .object({
    company: z
      .object({
        name: z.string(),
        supportEmail: z.string(),
        supportPhone: z.string(),
        address: z.string(),
        timezone: z.string(),
        taxRegistrationNo: z.string(),
      })
      .partial(),
    dispatch: z
      .object({
        offerTimeoutHours: z.number(),
        maxActiveJobs: z.number(),
        proximityWeight: z.number(),
        ratingWeight: z.number(),
        defaultRadiusKm: z.number(),
      })
      .partial(),
    billing: z
      .object({
        invoicePrefix: z.string(),
        defaultTaxRatePct: z.number(),
        defaultLabourRateLkr: z.number(),
        paymentTermsDays: z.number(),
      })
      .partial(),
    requests: z.object({ requirePlanToRequest: z.boolean(), allowCustomerCancellation: z.boolean() }).partial(),
    security: z
      .object({ passwordMinLength: z.number(), maxFailedLogins: z.number(), lockoutMinutes: z.number() })
      .partial(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });
