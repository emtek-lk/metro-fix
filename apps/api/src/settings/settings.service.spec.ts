import { BadRequestException } from '@nestjs/common';
import { DEFAULT_APP_SETTINGS, mergeAppSettings, passwordPolicyProblem, validateAppSettings } from '@metro-fix/core-types';
import { SettingsService } from './settings.service';

const admin = { id: 'a1', fullName: 'System Administrator', email: 'admin@demo.local', role: 'ADMIN' };

function build(stored?: unknown) {
  let row: any = stored === undefined ? null : { key: 'app', value: JSON.stringify(stored) };
  const repo = {
    findOne: jest.fn(async () => row),
    create: jest.fn((v: any) => v),
    save: jest.fn(async (v: any) => { row = v; return v; }),
  };
  const audit = { record: jest.fn(async () => undefined) };
  return { service: new SettingsService(repo as any, audit as any), repo, audit };
}

describe('SettingsService', () => {
  it('falls back to the defaults, and fills in settings added after something was saved', async () => {
    expect(await build().service.get()).toEqual(DEFAULT_APP_SETTINGS);
    const partial = await build({ dispatch: { maxActiveJobs: 8 } }).service.get();
    expect(partial.dispatch).toMatchObject({ maxActiveJobs: 8, offerTimeoutHours: 9 });
    expect(partial.security.passwordMinLength).toBe(8);
  });

  it('saves a partial change, serves it straight away and audits exactly what changed', async () => {
    const { service, audit, repo } = build();
    const next = await service.update({ dispatch: { maxActiveJobs: 7 }, billing: { defaultTaxRatePct: 18 } }, admin);
    expect(next.dispatch.maxActiveJobs).toBe(7);
    expect((await service.get()).billing.defaultTaxRatePct).toBe(18);
    expect(JSON.parse(repo.save.mock.calls[0][0].value).dispatch.maxActiveJobs).toBe(7);
    expect(audit.record).toHaveBeenCalledWith({
      actor: admin,
      action: 'settings.update',
      target: 'dispatch, billing',
      detail: { 'dispatch.maxActiveJobs': { from: 5, to: 7 }, 'billing.defaultTaxRatePct': { from: 0, to: 18 } },
    });
  });

  it('refuses invalid values with a message per field and saves nothing', async () => {
    const { service, repo } = build();
    const bad = service.update({ dispatch: { maxActiveJobs: 0 }, security: { passwordMinLength: 3 }, company: { supportEmail: 'nope' } }, admin);
    await expect(bad).rejects.toBeInstanceOf(BadRequestException);
    await bad.catch((e) => {
      expect(Object.keys(e.getResponse().errors).sort()).toEqual(['company.supportEmail', 'dispatch.maxActiveJobs', 'security.passwordMinLength']);
    });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not write or audit when nothing actually changes', async () => {
    const { service, repo, audit } = build();
    await service.update({ dispatch: { maxActiveJobs: 5 } }, admin);
    expect(repo.save).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('exposes only what the sign-in screen and the apps need', async () => {
    const { service } = build({ company: { name: 'Metro Fix Lanka', supportEmail: 'help@metrofix.lk' } });
    expect(await service.getPublic()).toEqual({ companyName: 'Metro Fix Lanka', supportEmail: 'help@metrofix.lk', supportPhone: '', passwordMinLength: 8 });
    const forApps = await service.getForApps();
    expect(forApps).toMatchObject({ currency: 'LKR', defaultLabourRateLkr: 2500, requirePlanToRequest: true });
    expect(JSON.stringify(forApps)).not.toMatch(/maxFailedLogins|lockoutMinutes|taxRegistration/);
  });
});

describe('settings helpers', () => {
  it('merges section by section and ignores unknown keys', () => {
    const merged = mergeAppSettings(DEFAULT_APP_SETTINGS, { dispatch: { maxActiveJobs: 9, bogus: 1 }, nope: { a: 1 } } as any);
    expect(merged.dispatch.maxActiveJobs).toBe(9);
    expect((merged.dispatch as any).bogus).toBeUndefined();
    expect(DEFAULT_APP_SETTINGS.dispatch.maxActiveJobs).toBe(5);
  });

  it('validates ranges and cross-field rules', () => {
    expect(validateAppSettings(DEFAULT_APP_SETTINGS)).toEqual({});
    const s = mergeAppSettings(DEFAULT_APP_SETTINGS, { dispatch: { proximityWeight: 0, ratingWeight: 0 }, billing: { invoicePrefix: 'bad prefix!' } });
    expect(Object.keys(validateAppSettings(s)).sort()).toEqual(['billing.invoicePrefix', 'dispatch.ratingWeight']);
  });

  it('describes why a password is rejected', () => {
    expect(passwordPolicyProblem('abc12', 8)).toContain('at least 8');
    expect(passwordPolicyProblem('abcdefghij', 8)).toContain('letters and numbers');
    expect(passwordPolicyProblem('abcdefg1', 8)).toBeNull();
  });
});
