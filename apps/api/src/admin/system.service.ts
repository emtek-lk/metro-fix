import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ticketRef } from '@metro-fix/core-types';
import { CustomerEntity, ServiceRequestEntity, UserEntity, WorkerEntity } from '../entities';
import { AuditService, type AuditActor } from '../audit/audit.service';
import { toCsv } from './csv';

export type ExportEntity = 'customers' | 'workers' | 'jobs';
export const EXPORT_ENTITIES: ExportEntity[] = ['customers', 'workers', 'jobs'];

export interface SystemInfo {
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  database: 'ok' | 'unreachable';
  counts: { users: number; customers: number; workers: number; jobs: number };
}

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(WorkerEntity) private readonly workers: Repository<WorkerEntity>,
    @InjectRepository(ServiceRequestEntity) private readonly jobs: Repository<ServiceRequestEntity>,
    private readonly audit: AuditService,
  ) {}

  async info(): Promise<SystemInfo> {
    let database: SystemInfo['database'] = 'ok';
    let counts = { users: 0, customers: 0, workers: 0, jobs: 0 };
    try {
      counts = {
        users: await this.users.count(),
        customers: await this.customers.count(),
        workers: await this.workers.count(),
        jobs: await this.jobs.count(),
      };
    } catch {
      database = 'unreachable';
    }
    return {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      database,
      counts,
    };
  }

  /** A CSV of one table for the admin to download. Passwords and tokens are never included. */
  async exportCsv(entity: string, actor: AuditActor): Promise<{ filename: string; csv: string }> {
    if (!EXPORT_ENTITIES.includes(entity as ExportEntity)) {
      throw new BadRequestException(`Export one of: ${EXPORT_ENTITIES.join(', ')}.`);
    }
    let csv: string;
    if (entity === 'customers') {
      const rows = await this.customers.find({ relations: { user: true }, order: { createdAt: 'ASC' } });
      csv = toCsv(
        ['Name', 'Company', 'Email', 'Phone', 'Address', 'Facility', 'Plan', 'Billing', 'Subscribed since', 'Joined'],
        rows.map((c) => [
          c.user?.fullName, c.companyName, c.user?.email, c.user?.phoneNumber, c.address, c.facilityType,
          c.subscriptionTier ?? 'No plan', c.billingCycle, c.subscribedAt?.toISOString().slice(0, 10), c.createdAt?.toISOString().slice(0, 10),
        ]),
      );
    } else if (entity === 'workers') {
      const rows = await this.workers.find({ relations: { user: true }, order: { createdAt: 'ASC' } });
      csv = toCsv(
        ['Name', 'Email', 'Phone', 'Rating', 'Services', 'On duty', 'Joined'],
        rows.map((w) => [
          w.user?.fullName, w.user?.email, w.user?.phoneNumber, w.rating, (w.servicePillars ?? []).join(' / '),
          w.isAvailable ? 'Yes' : 'No', w.createdAt?.toISOString().slice(0, 10),
        ]),
      );
    } else {
      const rows = await this.jobs.find({ relations: { customer: { user: true }, worker: { user: true } }, order: { createdAt: 'DESC' } });
      csv = toCsv(
        ['Ticket', 'Title', 'Status', 'Service', 'Urgency', 'Customer', 'Worker', 'Quote (LKR)', 'Raised', 'Closed'],
        rows.map((j) => [
          ticketRef(j.id), j.title, j.status, j.servicePillar, j.urgency, j.customer?.user?.fullName, j.worker?.user?.fullName,
          j.jobCard?.final?.total ?? j.jobCard?.estimate?.total ?? j.quoteAmount ?? '', j.createdAt?.toISOString().slice(0, 10), j.closedAt?.toISOString().slice(0, 10) ?? '',
        ]),
      );
    }
    await this.audit.record({ actor, action: 'data.export', target: entity });
    return { filename: `metro-fix-${entity}-${new Date().toISOString().slice(0, 10)}.csv`, csv };
  }
}
