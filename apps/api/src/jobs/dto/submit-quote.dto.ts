import { z } from 'zod';
import { SubmitJobQuoteDto as CoreSubmitJobQuoteDto } from '@metro-fix/core-types';

export const submitQuoteSchema = z.object({
  estimatedCost: z.number().nonnegative('Estimated cost must be 0 or greater.'),
  estimatedHours: z.number().nonnegative('Estimated hours must be 0 or greater.'),
  notes: z.string().optional().default(''),
});

export class SubmitQuoteDto implements CoreSubmitJobQuoteDto {
  estimatedCost: number;
  estimatedHours: number;
  notes: string;
}
