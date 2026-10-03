import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { FinancialsService } from './financials.service';

@Roles(Role.ADMIN)
@Controller('financials')
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Get()
  async getFinancials() {
    return this.financialsService.getFinancialRecords();
  }

  @Get('export')
  async exportCsv(@Res() res: Response) {
    const csvContent = await this.financialsService.generateCsvReport();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="financial_report.csv"');
    return res.status(200).send(csvContent);
  }
}
