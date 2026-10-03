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

function build(options: { existingEmail?: string; storedHash?: string } = {}) {
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
        ? { id: 'user-1', email: 'a@b.co', role: Role.WORKER, password: options.storedHash }
        : null,
    ),
  };
  const userRepository = {
    findOne: jest.fn(async ({ where }: any) =>
      options.existingEmail && where.email === options.existingEmail ? { id: 'someone' } : null,
    ),
    createQueryBuilder: jest.fn(() => queryBuilder),
    manager: { transaction: jest.fn(async (work: any) => work(manager)) },
  };
  const jwt = { sign: jest.fn(() => 'signed.jwt') };
  const service = new AuthService(userRepository as any, jwt as any);
  return { service, userRepository, manager, saved, queryBuilder, jwt };
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
    [{ ...valid, password: 'short1' }, 'short password'],
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
