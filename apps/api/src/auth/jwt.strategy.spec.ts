import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

const payload = { sub: 'u1', email: 'w@demo.local', role: 'WORKER' };

function build(user: any) {
  process.env.JWT_SECRET = 'test-secret';
  const repo = { findOne: jest.fn(async () => user) };
  return new JwtStrategy(repo as any);
}

describe('JwtStrategy one-time passwords', () => {
  it('lets a normal session through everywhere', async () => {
    const strategy = build({ id: 'u1', isActive: true, mustChangePassword: false });
    await expect(strategy.validate({ method: 'GET', originalUrl: '/jobs' }, payload)).resolves.toMatchObject({ id: 'u1' });
  });

  it('only allows reading the profile and changing the password until the worker picks their own', async () => {
    const strategy = build({ id: 'u1', isActive: true, mustChangePassword: true });
    await expect(strategy.validate({ method: 'GET', originalUrl: '/auth/me' }, payload)).resolves.toBeDefined();
    await expect(strategy.validate({ method: 'POST', originalUrl: '/auth/change-password?x=1' }, payload)).resolves.toBeDefined();
    await expect(strategy.validate({ method: 'GET', originalUrl: '/workers/me/jobs' }, payload)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(strategy.validate({ method: 'PATCH', originalUrl: '/auth/profile' }, payload)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('still rejects deactivated or missing users first', async () => {
    await expect(build({ id: 'u1', isActive: false }).validate({ method: 'GET', originalUrl: '/jobs' }, payload)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(build(null).validate({ method: 'GET', originalUrl: '/jobs' }, payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
