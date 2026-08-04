import { z } from 'zod';
import { RegisterPushTokenDto as CoreRegisterPushTokenDto } from '@metro-fix/core-types';

export const registerPushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required.'),
});

export class RegisterPushTokenDto implements CoreRegisterPushTokenDto {
  pushToken: string;
}
