import { z } from 'zod';
import { jobCardLineItemSchema, type JobCardSectionInput } from './job-card.dto';

/**
 * An inspection quote. New clients send an itemised card (`lineItems`); the original flat form
 * (`estimatedCost` + `estimatedHours`) is still accepted and becomes a single line.
 */
export const submitQuoteSchema = z
  .object({
    estimatedCost: z.number().nonnegative('Estimated cost must be 0 or greater.').optional(),
    estimatedHours: z.number().nonnegative('Estimated hours must be 0 or greater.').optional(),
    notes: z.string().optional().default(''),
    lineItems: z.array(jobCardLineItemSchema).min(1).max(60).optional(),
    taxRate: z.number().min(0).max(100).optional(),
  })
  .refine(
    (value) => value.lineItems || (value.estimatedCost !== undefined && value.estimatedHours !== undefined),
    { message: 'Provide itemised lines, or an estimated cost and hours.' },
  );

export class SubmitQuoteDto {
  estimatedCost?: number;
  estimatedHours?: number;
  notes: string;
  lineItems?: JobCardSectionInput['lineItems'];
  taxRate?: number;
}
