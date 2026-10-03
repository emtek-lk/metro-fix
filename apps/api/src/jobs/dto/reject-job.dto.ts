import { z } from 'zod';

export const rejectJobSchema = z.object({
  reason: z.string().trim().min(3, 'Please give a reason.'),
});

export class RejectJobDto {
  reason: string;
}
