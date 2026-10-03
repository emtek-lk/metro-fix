import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JobStatus, jobCardBillable, ticketRef } from '@metro-fix/core-types';
import { ServiceRequestEntity, SubscriptionPaymentEntity } from '../entities';

export interface FinancialRecordDto {
  /** Invoice number, derived from the ticket reference. */
  id: string;
  jobId: string;
  customerName: string;
  servicePillar: string;
  /** Formatted, e.g. "LKR 4,500.00". */
  amount: string;
  amountLkr: number;
  hours: number;
  /** Invoiced = approved and closed by dispatch; Awaiting approval = work done, not yet closed. */
  paymentStatus: 'Invoiced' | 'Awaiting approval';
  invoiceDate: string;
}

export interface FinancialSummaryDto {
  currency: 'LKR';
  months: { key: string; label: string; jobs: number; subscriptions: number; total: number }[];
  byPillar: { name: string; value: number }[];
  kpis: { invoiced: number; awaitingApproval: number; subscriptions: number; invoiceCount: number };
}

const money = (value: number) =>
  `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(ServiceRequestEntity)
    private readonly jobRepo: Repository<ServiceRequestEntity>,
    @InjectRepository(SubscriptionPaymentEntity)
    private readonly paymentRepo: Repository<SubscriptionPaymentEntity>,
  ) {}

  /** What a finished job bills: the confirmed final job card, else the estimate, else the flat quote. */
  private billable(job: ServiceRequestEntity): { amount: number; hours: number } {
    const section = jobCardBillable(job.jobCard);
    if (section) return { amount: section.total, hours: section.hours };
    return { amount: Number(job.quoteAmount ?? 0), hours: Number(job.estimatedHours ?? 0) };
  }

  private async billedJobs(): Promise<ServiceRequestEntity[]> {
    return this.jobRepo.find({
      where: { status: In([JobStatus.COMPLETED, JobStatus.CLOSED]) },
      relations: { customer: { user: true } },
      order: { updatedAt: 'DESC' },
    });
  }

  /** One row per finished job that has a price. Nothing is invented: no jobs, no rows. */
  async getFinancialRecords(): Promise<FinancialRecordDto[]> {
    const jobs = await this.billedJobs();
    return jobs
      .map((job) => ({ job, ...this.billable(job) }))
      .filter(({ amount }) => amount > 0)
      .map(({ job, amount, hours }) => {
        const ref = ticketRef(job.id);
        const billedAt = job.closedAt ?? job.updatedAt ?? job.createdAt;
        return {
          id: `INV-${ref}`,
          jobId: ref,
          customerName: job.customer?.user?.fullName || 'Customer',
          servicePillar: job.servicePillar,
          amount: money(amount),
          amountLkr: amount,
          hours,
          paymentStatus: job.status === JobStatus.CLOSED ? 'Invoiced' : 'Awaiting approval',
          invoiceDate: new Date(billedAt).toISOString().split('T')[0],
        } as FinancialRecordDto;
      });
  }

  /** Revenue for the last six months (invoiced jobs plus subscription payments), by pillar, and headline numbers. */
  async getSummary(now: Date = new Date()): Promise<FinancialSummaryDto> {
    const jobs = await this.billedJobs();
    const payments = await this.paymentRepo.find({ where: { status: 'SUCCEEDED' } });

    const months: FinancialSummaryDto['months'] = [];
    for (let back = 5; back >= 0; back -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
      months.push({
        key: monthKey(date),
        label: date.toLocaleString('en-US', { month: 'short' }),
        jobs: 0,
        subscriptions: 0,
        total: 0,
      });
    }
    const bucket = (date: Date) => months.find((m) => m.key === monthKey(date));

    const pillars = new Map<string, number>();
    let invoiced = 0;
    let awaiting = 0;
    let invoiceCount = 0;
    for (const job of jobs) {
      const { amount } = this.billable(job);
      if (amount <= 0) continue;
      if (job.status === JobStatus.COMPLETED) {
        awaiting += amount;
        continue;
      }
      invoiced += amount;
      invoiceCount += 1;
      pillars.set(titleCase(job.servicePillar), (pillars.get(titleCase(job.servicePillar)) ?? 0) + amount);
      const slot = bucket(new Date(job.closedAt ?? job.updatedAt ?? job.createdAt));
      if (slot) slot.jobs += amount;
    }

    let subscriptions = 0;
    for (const payment of payments) {
      subscriptions += payment.amountLkr;
      const slot = bucket(new Date(payment.createdAt));
      if (slot) slot.subscriptions += payment.amountLkr;
    }
    months.forEach((m) => {
      m.total = m.jobs + m.subscriptions;
    });
    if (subscriptions > 0) pillars.set('Subscriptions', subscriptions);

    // Always list the three pillars so the chart has a stable shape even before any invoices.
    for (const name of ['Hard', 'Soft', 'Strategic']) if (!pillars.has(name)) pillars.set(name, 0);

    return {
      currency: 'LKR',
      months,
      byPillar: [...pillars.entries()].map(([name, value]) => ({ name, value })),
      kpis: { invoiced, awaitingApproval: awaiting, subscriptions, invoiceCount },
    };
  }

  async generateCsvReport(): Promise<string> {
    const records = await this.getFinancialRecords();
    const headers = ['Invoice ID', 'Ticket', 'Customer Name', 'Service Pillar', 'Amount (LKR)', 'Hours', 'Status', 'Date'];
    const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = records.map((r) =>
      [r.id, r.jobId, r.customerName, r.servicePillar, r.amountLkr.toFixed(2), r.hours, r.paymentStatus, r.invoiceDate].map(cell),
    );
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
