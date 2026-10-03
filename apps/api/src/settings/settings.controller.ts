import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { Role, type AppSettings, type AppSettingsPatch, type PublicAppSettings, type SignedInAppSettings } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { SettingsService } from './settings.service';
import { updateSettingsSchema } from './dto/update-settings.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Company contact and the password rule, for the sign-in and sign-up screens. */
  @Public()
  @Get('public')
  async getPublic(): Promise<PublicAppSettings> {
    return this.settings.getPublic();
  }

  /** Defaults and rules any signed-in app needs (quoting defaults, whether customers can cancel). */
  @Get('app')
  async getForApps(): Promise<SignedInAppSettings> {
    return this.settings.getForApps();
  }

  @Roles(Role.ADMIN)
  @Get()
  async getAll(): Promise<AppSettings> {
    return this.settings.get();
  }

  /** Changes any of the settings; send only the fields to change. Every change is audited. */
  @Roles(Role.ADMIN)
  @Patch()
  async update(
    @Body(new ZodValidationPipe(updateSettingsSchema)) body: AppSettingsPatch,
    @Req() req: { user: { id: string; fullName: string; email: string; role: string } },
  ): Promise<AppSettings> {
    return this.settings.update(body, req.user);
  }
}
