import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role, FacilityType } from '@metro-fix/core-types';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { registerSchema } from './dto/register.dto';

const valid = {
  fullName: 'Eleanor Vance',
  email: 'Eleanor@SkylineTowers.com ',
  phoneNumber: '+94 77 123 4567',
  password: 'Skyline2026',
};

function build(options: { existingEmail?: string; storedHash?: string; user?: Record<string, unknown>; settings?: any } = {}) {
  const saved: any[] = [];
  const manager = {
    create: jest.fn((_entity: unknown, value: any) => ({ ...value })),
    save: jest.fn(async (value: any) => {
      const withId = { id: value.userId ? 'customer-1' : 'user-1', ...value };
      saved.push(withId);
      return withId;
    }),
  };
  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(async () =>
      options.storedHash
        ? { id: 'user-1', email: 'a@b.co', role: Role.WORKER, fullName: 'A B', password: options.storedHash, ...options.user }
        : null,
    ),
  };
  const userRepository = {
    findOne: jest.fn(async ({ where }: any) =>
      options.existingEmail && where.email === options.existingEmail ? { id: 'someone' } : null,
    ),
    createQueryBuilder: jest.fn(() => queryBuilder),
    update: jest.fn(async () => ({ affected: 1 })),
    manager: { transaction: jest.fn(async (work: any) => work(manager)) },
  };
  const jwt = { sign: jest.fn(() => 'signed.jwt') };
  const audit = { record: jest.fn(async () => undefined) };
  const service = new AuthService(userRepository as any, jwt as any, options.settings, audit as any);
  return { audit, service, userRepository, manager, saved, queryBuilder, jwt };
}

describe('registration schema', () => {
  it('normalises a valid sign-up', () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe('eleanor@skylinetowers.com');
    expect(parsed.fullName).toBe('Eleanor Vance');
  });

  it.each([
    [{ ...valid, fullName: 'E' }, 'full name'],
    [{ ...valid, email: 'not-an-email' }, 'email'],
    [{ ...valid, phoneNumber: '12345' }, 'phone'],
    [{ ...valid, password: 'abc12' }, 'short password'],
    [{ ...valid, password: 'onlyletters' }, 'no digits'],
    [{ ...valid, password: '123456789' }, 'no letters'],
  ])('rejects %#: %s', (input) => {
    expect(registerSchema.safeParse(input).success).toBe(false);
  });
});

describe('AuthService.register', () => {
  it('creates a CUSTOMER account and profile and returns a signed-in session', async () => {
    const { service, manager, saved } = build();
    const session = await service.register(registerSchema.parse(valid));

    expect(session.accessToken).toBe('signed.jwt');
    expect(session.user).toMatchObject({ email: 'eleanor@skylinetowers.com', role: Role.CUSTOMER });
    expect(saved).toHaveLength(2);
    expect(manager.create.mock.calls[1][1]).toMatchObject({
      userId: 'user-1',
      facilityType: FacilityType.RESIDENTIAL,
      // A new sign-up is a lead: no plan until they subscribe.
      subscriptionTier: null,
    });
  });

  it('never trusts a role sent by the client', async () => {
    const { service, manager } = build();
    await service.register({ ...registerSchema.parse(valid), role: Role.ADMIN } as any);
    expect(manager.create.mock.calls[0][1].role).toBe(Role.CUSTOMER);
  });

  it('refuses an email that is already registered', async () => {
    const { service, manager } = build({ existingEmail: 'eleanor@skylinetowers.com' });
    await expect(service.register(registerSchema.parse(valid))).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe('AuthService.validateUser', () => {
  it('asks for the password hash explicitly, because the column is hidden by default', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    const { service, queryBuilder } = build({ storedHash: hash });
    await expect(service.validateUser('a@b.co', 'Demo123!')).resolves.toMatchObject({ id: 'user-1' });
    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.password');
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    await expect(build({ storedHash: hash }).service.validateUser('a@b.co', 'nope')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(build().service.validateUser('x@y.co', 'Demo123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('sign-in protection', () => {
  const settings = (security: Partial<Record<'maxFailedLogins' | 'lockoutMinutes' | 'passwordMinLength', number>> = {}) => ({
    get: jest.fn(async () => ({ security: { passwordMinLength: 8, maxFailedLogins: 3, lockoutMinutes: 15, ...security } })),
  });

  it('counts wrong passwords and locks the account at the limit', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    const first = build({ storedHash: hash, settings: settings(), user: { failedLoginCount: 0 } });
    await expect(first.service.validateUser('a@b.co', 'bad')).rejects.toThrow('Invalid email or password.');
    expect(first.userRepository.update).toHaveBeenCalledWith('user-1', { failedLoginCount: 1 });

    const last = build({ storedHash: hash, settings: settings(), user: { failedLoginCount: 2 } });
    await expect(last.service.validateUser('a@b.co', 'bad')).rejects.toThrow('Invalid email or password.');
    const [, patch] = (last.userRepository.update as jest.Mock).mock.calls[0];
    expect(patch.failedLoginCount).toBe(0);
    expect(patch.lockedUntil.getTime()).toBeGreaterThan(Date.now() + 14 * 60000);
    expect(last.audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'auth.lockout' }));
  });

  it('refuses a locked account even with the right password, and says for how long', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    const { service } = build({ storedHash: hash, settings: settings(), user: { lockedUntil: new Date(Date.now() + 5 * 60000) } });
    await expect(service.validateUser('a@b.co', 'Demo123!')).rejects.toThrow(/Try again in [45] minutes?/);
  });

  it('does not count or lock when lockout is switched off', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    const { service, userRepository } = build({ storedHash: hash, settings: settings({ maxFailedLogins: 0 }) });
    await expect(service.validateUser('a@b.co', 'bad')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('clears the counter and notes the sign-in time on success', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    const { service, userRepository } = build({ storedHash: hash, settings: settings(), user: { failedLoginCount: 2 } });
    await service.validateUser('a@b.co', 'Demo123!');
    const [, patch] = (userRepository.update as jest.Mock).mock.calls[0];
    expect(patch).toMatchObject({ failedLoginCount: 0, lockedUntil: null });
    expect(patch.lastLoginAt).toBeInstanceOf(Date);
  });

  it('turns away a deactivated account, but only once the password is right', async () => {
    const hash = await bcrypt.hash('Demo123!', 4);
    const off = build({ storedHash: hash, user: { isActive: false } });
    await expect(off.service.validateUser('a@b.co', 'Demo123!')).rejects.toThrow('deactivated');
    await expect(off.service.validateUser('a@b.co', 'wrong')).rejects.toThrow('Invalid email or password.');
  });
});

describe('password rules and changes', () => {
  const policy = (passwordMinLength: number) => ({ get: jest.fn(async () => ({ security: { passwordMinLength, maxFailedLogins: 5, lockoutMinutes: 15 } })) });

  it('applies the minimum length from Settings > Security to new sign-ups', async () => {
    const strict = build({ settings: policy(12) });
    await expect(strict.service.register({ ...valid, password: 'Skyline2026' } as any)).rejects.toThrow('at least 12');
    const relaxed = build({ settings: policy(8) });
    await expect(relaxed.service.register({ ...valid, password: 'Skyline2026' } as any)).resolves.toBeDefined();
  });

  it('changes a password only when the current one is right and the new one passes the policy', async () => {
    const hash = await bcrypt.hash('Old12345', 4);
    const ok = build({ storedHash: hash, settings: policy(8) });
    await ok.service.changePassword('user-1', 'Old12345', 'NewPass2026');
    const [, patch] = (ok.userRepository.update as jest.Mock).mock.calls[0];
    expect(await bcrypt.compare('NewPass2026', patch.password)).toBe(true);
    expect(ok.audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'auth.change-password' }));

    await expect(build({ storedHash: hash, settings: policy(8) }).service.changePassword('user-1', 'wrong', 'NewPass2026')).rejects.toThrow('current password');
    await expect(build({ storedHash: hash, settings: policy(8) }).service.changePassword('user-1', 'Old12345', 'short1')).rejects.toThrow('at least 8');
    await expect(build({ storedHash: hash, settings: policy(8) }).service.changePassword('user-1', 'Old12345', 'Old12345')).rejects.toThrow('different');
  });
});
