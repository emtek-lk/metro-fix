import { Body, Controller, Get, Param, Patch, Post, Req, Res, UsePipes } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminUsersService, type CreateStaffInput, type UpdateUserInput } from './admin-users.service';
import { SystemService } from './system.service';

type AuthedRequest = { user: { id: string; fullName: string; email: string; role: string } };

const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter their full name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  phoneNumber: z.string().trim().max(30).optional(),
  role: z.enum([Role.ADMIN, Role.CUSTOMER_CARE]),
  password: z.string().min(1, 'Set a temporary password.').max(128),
});

const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phoneNumber: z.string().trim().max(30).optional(),
    role: z.enum([Role.ADMIN, Role.CUSTOMER_CARE]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

const resetPasswordSchema = z.object({ password: z.string().min(1, 'Enter a new password.').max(128) });

/** Account administration and system tools for admins. */
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly system: SystemService,
  ) {}

  @Get('users')
  listStaff() {
    return this.users.listStaff();
  }

  @Post('users')
  @UsePipes(new ZodValidationPipe(createStaffSchema))
  createStaff(@Body() dto: CreateStaffInput, @Req() req: AuthedRequest) {
    return this.users.createStaff(dto, req.user);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserInput, @Req() req: AuthedRequest) {
    return this.users.updateUser(id, dto, req.user);
  }

  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resetPasswordSchema)) dto: { password: string },
    @Req() req: AuthedRequest,
  ) {
    await this.users.resetPassword(id, dto.password, req.user);
    return { ok: true };
  }

  @Post('users/:id/unlock')
  unlock(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.users.unlock(id, req.user);
  }

  @Get('system')
  info() {
    return this.system.info();
  }

  @Get('export/:entity')
  async export(@Param('entity') entity: string, @Req() req: AuthedRequest, @Res() res: Response) {
    const { filename, csv } = await this.system.exportCsv(entity, req.user);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  }
}
