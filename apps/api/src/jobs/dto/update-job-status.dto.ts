import { z } from 'zod';
import { JobStatus } from '@metro-fix/core-types';

export const updateJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
  workerId: z.string().optional().nullable(),
});

export class UpdateJobStatusDto {
  status: JobStatus;
  workerId?: string | null;
}
