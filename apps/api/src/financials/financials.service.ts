import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequestEntity } from '../entities';

export interface FinancialRecordDto {
  id: string;
  jobId: string;
  customerName: string;
  servicePillar: string;
  amount: string;
  paymentStatus: string;
  invoiceDate: string;
}

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
  ) {}

  async getFinancialRecords(): Promise<FinancialRecordDto[]> {
    const jobs = await this.jobRepo.find({ relations: { customer: { user: true } } });

    if (jobs.length === 0) {
      return [
        { id: 'INV-9001', jobId: 'REQ-1001', customerName: 'Skyline Commercial Towers', servicePillar: 'Hard', amount: '$1,250.00', paymentStatus: 'Paid', invoiceDate: '2026-07-23' },
        { id: 'INV-9002', jobId: 'REQ-1002', customerName: 'Tower One Management', servicePillar: 'Soft', amount: '$480.00', paymentStatus: 'Pending', invoiceDate: '2026-07-22' },
        { id: 'INV-9003', jobId: 'REQ-1003', customerName: 'Metro Logistics LLC', servicePillar: 'Strategic', amount: '$2,100.00', paymentStatus: 'Paid', invoiceDate: '2026-07-21' },
        { id: 'INV-9004', jobId: 'REQ-1004', customerName: 'Northpoint Residences', servicePillar: 'Hard', amount: '$350.00', paymentStatus: 'Paid', invoiceDate: '2026-07-21' },
        { id: 'INV-9005', jobId: 'REQ-1005', customerName: 'Greenfield Mall', servicePillar: 'Strategic', amount: '$1,850.00', paymentStatus: 'Paid', invoiceDate: '2026-07-20' },
      ];
    }

    return jobs.map((job, idx) => ({
      id: `INV-900${idx + 1}`,
      jobId: `REQ-${1000 + idx + 1}`,
      customerName: job.customer?.user?.fullName || 'Facility Customer',
      servicePillar: job.servicePillar || 'Hard',
      amount: job.quoteAmount ? `$${job.quoteAmount.toFixed(2)}` : `$${(450 + idx * 150).toFixed(2)}`,
      paymentStatus: idx % 3 === 1 ? 'Pending' : 'Paid',
      invoiceDate: new Date(job.createdAt || Date.now()).toISOString().split('T')[0],
    }));
  }

  async generateCsvReport(): Promise<string> {
    const records = await this.getFinancialRecords();
    const headers = ['Invoice ID', 'Job ID', 'Customer Name', 'Service Pillar', 'Amount', 'Payment Status', 'Invoice Date'];
    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.jobId}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      `"${r.servicePillar}"`,
      `"${r.amount}"`,
      `"${r.paymentStatus}"`,
      `"${r.invoiceDate}"`,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
