import { staffPasswordFromEnv } from './staff-password';

describe('staffPasswordFromEnv', () => {
  it('means "use the demo password" when unset or blank outside production', () => {
    expect(staffPasswordFromEnv(undefined, 'development')).toBeNull();
    expect(staffPasswordFromEnv('', 'development')).toBeNull();
    expect(staffPasswordFromEnv('   ', undefined)).toBeNull();
  });

  it('refuses to start in production without one', () => {
    expect(() => staffPasswordFromEnv(undefined, 'production')).toThrow(/must be set/);
    expect(() => staffPasswordFromEnv('  ', 'production')).toThrow(/must be set/);
  });

  it('accepts a strong password and trims it', () => {
    expect(staffPasswordFromEnv('  Longer-Secret-2026  ', 'production')).toBe('Longer-Secret-2026');
  });

  it('rejects a short password', () => {
    expect(() => staffPasswordFromEnv('Abc12345')).toThrow(/at least 12/);
  });

  it('rejects a password with no digits or no letters', () => {
    expect(() => staffPasswordFromEnv('onlyletterslongenough')).toThrow(/letters and numbers/);
    expect(() => staffPasswordFromEnv('123456789012345')).toThrow(/letters and numbers/);
  });
});
