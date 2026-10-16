import { z } from 'zod';
import { UpdateWorkerLocationDto as CoreUpdateWorkerLocationDto } from '@metro-fix/core-types';

export const updateWorkerLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  heading: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
});

export class UpdateWorkerLocationDto implements CoreUpdateWorkerLocationDto {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
}
