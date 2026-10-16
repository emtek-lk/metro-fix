import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role, passwordPolicyProblem } from '@metro-fix/core-types';
import { UserEntity } from '../entities';
import { SettingsService } from '../settings/settings.service';
import { AuditService, type AuditActor } from '../audit/audit.service';

export const STAFF_ROLES: Role[] = [Role.ADMIN, Role.CUSTOMER_CARE];

export interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber: string | null;
  isActive: boolean;
  locked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateStaffInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  password: string;
}

export interface UpdateUserInput {
  fullName?: string;
  phoneNumber?: string;
  role?: Role;
  isActive?: boolean;
}

const toAccount = (user: UserEntity): StaffAccount => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber ?? null,
  isActive: user.isActive !== false,
  locked: Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()),
  lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
  createdAt: new Date(user.createdAt).toISOString(),
});

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  /** Admin and customer-care accounts, the people who run the platform. */
  async listStaff(): Promise<StaffAccount[]> {
    const users = await this.userRepo.find({ where: { role: In(STAFF_ROLES) }, order: { createdAt: 'ASC' } });
    return users.map(toAccount);
  }

  private async assertPassword(password: string): Promise<void> {
    const { security } = await this.settings.get();
    const problem = passwordPolicyProblem(password, security.passwordMinLength);
    if (problem) throw new BadRequestException(problem);
  }

  private async find(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('That account does not exist.');
    return user;
  }

  async createStaff(input: CreateStaffInput, actor: AuditActor): Promise<StaffAccount> {
    if (!STAFF_ROLES.includes(input.role)) throw new BadRequestException('Staff accounts are Admin or Customer Care.');
    const email = input.email.trim().toLowerCase();
    if (await this.userRepo.findOne({ where: { email } })) {
      throw new ConflictException(`An account with ${email} already exists.`);
    }
    await this.assertPassword(input.password);

    const saved = await this.userRepo.save(
      this.userRepo.create({
        fullName: input.fullName.trim(),
        email,
        phoneNumber: input.phoneNumber?.trim() || undefined,
        role: input.role,
        password: input.password, // hashed by the entity on insert
        isActive: true,
      }),
    );
    await this.audit.record({ actor, action: 'user.create', target: email, detail: { role: input.role } });
    return toAccount(saved);
  }

  /** Edits a person's name, phone, staff role or active flag. Admins cannot lock themselves out. */
  async updateUser(id: string, input: UpdateUserInput, actor: AuditActor): Promise<StaffAccount> {
    const user = await this.find(id);
    const isSelf = actor.id === user.id;

    if (input.role !== undefined && input.role !== user.role) {
      if (!STAFF_ROLES.includes(user.role) || !STAFF_ROLES.includes(input.role)) {
        throw new BadRequestException('Only staff accounts can switch between Admin and Customer Care.');
      }
      if (isSelf) throw new ForbiddenException('You cannot change your own role.');
    }
    if (input.isActive === false && isSelf) throw new ForbiddenException('You cannot deactivate your own account.');

    const losesAdmin =
      user.role === Role.ADMIN && user.isActive !== false && (input.isActive === false || (input.role !== undefined && input.role !== Role.ADMIN));
    if (losesAdmin) {
      const admins = await this.userRepo.count({ where: { role: Role.ADMIN, isActive: true } });
      if (admins <= 1) throw new ForbiddenException('There must be at least one active admin.');
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const apply = <K extends keyof UserEntity>(key: K, value: UserEntity[K] | undefined) => {
      if (value !== undefined && value !== user[key]) {
        changes[key as string] = { from: user[key], to: value };
        user[key] = value;
      }
    };
    apply('fullName', input.fullName?.trim());
    apply('phoneNumber', input.phoneNumber?.trim());
    apply('role', input.role);
    apply('isActive', input.isActive);
    if (Object.keys(changes).length === 0) return toAccount(user);

    // update() instead of save(): the password column is not loaded and must not be touched.
    await this.userRepo.update(user.id, {
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
    });
    const action = changes.isActive ? (user.isActive ? 'user.reactivate' : 'user.deactivate') : 'user.update';
    await this.audit.record({ actor, action, target: user.email, detail: changes });
    return toAccount(user);
  }

  async resetPassword(id: string, password: string, actor: AuditActor): Promise<void> {
    const user = await this.find(id);
    await this.assertPassword(password);
    await this.userRepo.update(user.id, {
      password: await bcrypt.hash(password, 10),
      // A worker's reset password is one-time: they choose their own at next sign-in.
      mustChangePassword: user.role === Role.WORKER,
      failedLoginCount: 0,
      lockedUntil: null,
    });
    await this.audit.record({ actor, action: 'user.reset-password', target: user.email });
  }

  async unlock(id: string, actor: AuditActor): Promise<StaffAccount> {
    const user = await this.find(id);
    await this.userRepo.update(user.id, { failedLoginCount: 0, lockedUntil: null });
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    await this.audit.record({ actor, action: 'user.unlock', target: user.email });
    return toAccount(user);
  }
}
