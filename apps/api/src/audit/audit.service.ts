import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities';

export interface AuditActor {
  id?: string | null;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface AuditEntry {
  actor: AuditActor;
  action: string;
  target?: string | null;
  detail?: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /** Writes one audit row. A failure to audit is logged, never allowed to break the action itself. */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          actorId: entry.actor.id ?? null,
          actorName: entry.actor.fullName || entry.actor.email || 'System',
          actorRole: entry.actor.role || 'SYSTEM',
          action: entry.action,
          target: entry.target ?? null,
          detail: entry.detail === undefined ? null : JSON.stringify(entry.detail),
        }),
      );
    } catch (error) {
      this.logger.warn(`Could not write audit entry ${entry.action}: ${(error as Error).message}`);
    }
  }

  async recent(limit = 100, action?: string): Promise<AuditLogEntity[]> {
    return this.repo.find({
      where: action ? { action } : {},
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}
