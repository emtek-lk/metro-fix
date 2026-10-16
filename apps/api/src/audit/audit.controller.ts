import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';

@Roles(Role.ADMIN)
@Controller('audit-log')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** The most recent settings and account changes, newest first. */
  @Get()
  async list(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('action') action?: string,
  ) {
    return this.audit.recent(limit, action || undefined);
  }
}
