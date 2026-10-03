import { z } from 'zod';

export const cancelJobSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export class CancelJobDto {
  reason?: string;
}
