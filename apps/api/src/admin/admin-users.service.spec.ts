import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@metro-fix/core-types';
import { AdminUsersService } from './admin-users.service';
import { toCsv, csvCell } from './csv';

const admin = { id: 'u-admin', fullName: 'Root', email: 'root@demo.local', role: 'ADMIN' };

function build(users: any[], adminCount = 2) {
  const repo = {
    find: jest.fn(async () => users),
    findOne: jest.fn(async ({ where }: any) => users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null),
    count: jest.fn(async () => adminCount),
    create: jest.fn((v: any) => ({ id: 'new', createdAt: new Date(), ...v })),
    save: jest.fn(async (v: any) => v),
    update: jest.fn(async (..._args: any[]) => ({ affected: 1 })),
  };
  const settings = { get: jest.fn(async () => ({ security: { passwordMinLength: 8 } })) };
  const audit = { record: jest.fn(async () => undefined) };
  return { service: new AdminUsersService(repo as any, settings as any, audit as any), repo, audit };
}
const person = (over: any = {}) => ({ id: 'u1', fullName: 'Ayesha K', email: 'ayesha@demo.local', role: Role.CUSTOMER_CARE, isActive: true, createdAt: new Date(), ...over });

describe('AdminUsersService', () => {
  it('creates a staff account with a policy-checked temporary password and audits it', async () => {
    const { service, audit } = build([]);
    const created = await service.createStaff({ fullName: 'Ayesha K', email: 'Ayesha@Demo.local', role: Role.CUSTOMER_CARE, password: 'Welcome2026' }, admin);
    expect(created).toMatchObject({ email: 'ayesha@demo.local', role: Role.CUSTOMER_CARE, isActive: true });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.create', target: 'ayesha@demo.local' }));
    await expect(service.createStaff({ fullName: 'X Y', email: 'x@y.co', role: Role.CUSTOMER_CARE, password: 'weak' }, admin)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createStaff({ fullName: 'X Y', email: 'x@y.co', role: Role.WORKER as any, password: 'Welcome2026' }, admin)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a duplicate email', async () => {
    const { service } = build([person()]);
    await expect(service.createStaff({ fullName: 'Ayesha K', email: 'ayesha@demo.local', role: Role.CUSTOMER_CARE, password: 'Welcome2026' }, admin)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates and reactivates, recording each', async () => {
    const { service, audit } = build([person()]);
    expect((await service.updateUser('u1', { isActive: false }, admin)).isActive).toBe(false);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.deactivate' }));
    expect((await service.updateUser('u1', { isActive: true }, admin)).isActive).toBe(true);
    expect(audit.record).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'user.reactivate' }));
  });

  it('stops an admin locking themselves out, or removing the last admin', async () => {
    const self = person({ id: 'u-admin', role: Role.ADMIN });
    const { service } = build([self]);
    await expect(service.updateUser('u-admin', { isActive: false }, admin)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.updateUser('u-admin', { role: Role.CUSTOMER_CARE }, admin)).rejects.toBeInstanceOf(ForbiddenException);

    const last = build([person({ id: 'other', role: Role.ADMIN })], 1);
    await expect(last.service.updateUser('other', { isActive: false }, admin)).rejects.toThrow('at least one active admin');
  });

  it('only moves staff between Admin and Customer Care', async () => {
    const { service } = build([person({ id: 'w1', role: Role.WORKER })]);
    await expect(service.updateUser('w1', { role: Role.ADMIN }, admin)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resets a password to a hash and clears any lockout', async () => {
    const { service, repo, audit } = build([person()]);
    await service.resetPassword('u1', 'Fresh2026Pass', admin);
    const [, patch] = repo.update.mock.calls[0];
    expect(await bcrypt.compare('Fresh2026Pass', patch.password)).toBe(true);
    expect(patch).toMatchObject({ failedLoginCount: 0, lockedUntil: null });
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain('Fresh2026Pass');
    await expect(service.resetPassword('u1', 'short', admin)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('csv export', () => {
  it('quotes cells and neutralises spreadsheet formulas', () => {
    expect(csvCell('a "quoted" cell')).toBe('"a ""quoted"" cell"');
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell('+94 77 123 4567')).toBe('"\'+94 77 123 4567"');
    expect(csvCell(null)).toBe('""');
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe('"A","B"\n"1","x"');
  });
});
