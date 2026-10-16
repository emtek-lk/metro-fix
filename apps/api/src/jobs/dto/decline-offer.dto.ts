import { z } from 'zod';

export const declineOfferSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export class DeclineOfferDto {
  reason?: string;
}
