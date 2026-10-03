import { z } from 'zod';
import type { JobCardLineItem, JobCardLineKind } from '@metro-fix/core-types';

// core-types ships zod v3 schemas; the API validates with zod v4, so the job card schema is local.
export const jobCardLineItemSchema = z.object({
  id: z.string().max(64).optional(),
  kind: z.enum(['LABOUR', 'MATERIAL', 'OTHER']).default('OTHER'),
  description: z.string().trim().min(1, 'Describe each line.').max(200),
  quantity: z.number().min(0, 'Quantity must be 0 or greater.').max(100000),
  unitPrice: z.number().min(0, 'Price must be 0 or greater.').max(100000000),
});

/** The editable body of an estimate or a final: itemised lines, time and notes. */
export const jobCardSectionSchema = z.object({
  lineItems: z.array(jobCardLineItemSchema).min(1, 'Add at least one line.').max(60),
  hours: z.number().min(0, 'Hours must be 0 or greater.').max(10000),
  notes: z.string().max(4000).optional().default(''),
  taxRate: z.number().min(0).max(100).optional(),
});

export type JobCardSectionInput = {
  lineItems: { id?: string; kind: JobCardLineKind; description: string; quantity: number; unitPrice: number }[];
  hours: number;
  notes: string;
  taxRate?: number;
};

export type { JobCardLineItem };
