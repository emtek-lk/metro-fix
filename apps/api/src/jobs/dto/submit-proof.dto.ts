import { z } from 'zod';
import { SubmitJobProofDto as CoreSubmitJobProofDto } from '@metro-fix/core-types';

export const submitProofSchema = z.object({
  signature: z.string().min(1, 'Signature is required.'),
  photos: z.array(z.string()).default([]),
});

export class SubmitProofDto implements CoreSubmitJobProofDto {
  signature: string;
  photos: string[];
}
