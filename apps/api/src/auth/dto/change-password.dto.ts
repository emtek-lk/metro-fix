import { z } from 'zod';

// The length and character rules come from Settings > Security and are checked in AuthService.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(128),
  newPassword: z.string().min(1, 'Enter a new password.').max(128),
});

export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}
