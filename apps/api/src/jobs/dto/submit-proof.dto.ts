import { z } from 'zod';
import { jobCardSectionSchema, type JobCardSectionInput } from './job-card.dto';

export const submitProofSchema = z.object({
  signature: z.string().min(1, 'Signature is required.'),
  photos: z.array(z.string()).default([]),
  /** The job card as confirmed or corrected at completion (what was actually done and how long it took). */
  finalCard: jobCardSectionSchema.optional(),
});

export class SubmitProofDto {
  signature: string;
  photos: string[];
  finalCard?: JobCardSectionInput;
}
