import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  validateAppSettings,
  type AppSettings,
  type AppSettingsPatch,
  type PublicAppSettings,
  type SignedInAppSettings,
} from '@metro-fix/core-types';
import { AppSettingEntity } from '../entities';
import { AuditService, type AuditActor } from '../audit/audit.service';

const SETTINGS_KEY = 'app';
const CACHE_MS = 5000;

@Injectable()
export class SettingsService {
  private cache: { value: AppSettings; at: number } | null = null;

  constructor(
    @InjectRepository(AppSettingEntity)
    private readonly repo: Repository<AppSettingEntity>,
    private readonly audit: AuditService,
  ) {}

  /** The current settings: stored values over the defaults, so a new setting always has a value. */
  async get(): Promise<AppSettings> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.value;
    const row = await this.repo.findOne({ where: { key: SETTINGS_KEY } });
    let stored: AppSettingsPatch | null = null;
    if (row) {
      try {
        stored = JSON.parse(row.value) as AppSettingsPatch;
      } catch {
        stored = null;
      }
    }
    const value = mergeAppSettings(DEFAULT_APP_SETTINGS, stored);
    this.cache = { value, at: Date.now() };
    return value;
  }

  /** Validates and saves a partial change, and records who made it and what changed. */
  async update(patch: AppSettingsPatch, actor: AuditActor): Promise<AppSettings> {
    const before = await this.get();
    const next = mergeAppSettings(before, patch);
    const errors = validateAppSettings(next);
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Some settings are not valid.', errors });
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const section of Object.keys(next) as (keyof AppSettings)[]) {
      for (const key of Object.keys(next[section])) {
        const from = (before[section] as Record<string, unknown>)[key];
        const to = (next[section] as Record<string, unknown>)[key];
        if (from !== to) changes[`${section}.${key}`] = { from, to };
      }
    }
    if (Object.keys(changes).length === 0) return before;

    await this.repo.save(
      this.repo.create({ key: SETTINGS_KEY, value: JSON.stringify(next), updatedBy: actor.email ?? actor.fullName ?? null }),
    );
    this.cache = { value: next, at: Date.now() };
    await this.audit.record({
      actor,
      action: 'settings.update',
      target: [...new Set(Object.keys(changes).map((k) => k.split('.')[0]))].join(', '),
      detail: changes,
    });
    return next;
  }

  /** What the login and sign-up screens may see before anyone is signed in. */
  async getPublic(): Promise<PublicAppSettings> {
    const s = await this.get();
    return {
      companyName: s.company.name,
      supportEmail: s.company.supportEmail,
      supportPhone: s.company.supportPhone,
      passwordMinLength: s.security.passwordMinLength,
    };
  }

  /** What any signed-in app needs: contact details, defaults for quoting, and the request rules. */
  async getForApps(): Promise<SignedInAppSettings> {
    const s = await this.get();
    return {
      ...(await this.getPublic()),
      currency: 'LKR',
      offerTimeoutHours: s.dispatch.offerTimeoutHours,
      defaultTaxRatePct: s.billing.defaultTaxRatePct,
      defaultLabourRateLkr: s.billing.defaultLabourRateLkr,
      allowCustomerCancellation: s.requests.allowCustomerCancellation,
      requirePlanToRequest: s.requests.requirePlanToRequest,
    };
  }
}
