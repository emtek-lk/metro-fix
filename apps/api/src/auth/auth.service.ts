import { BadRequestException, ConflictException, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role, FacilityType, DEFAULT_APP_SETTINGS, passwordPolicyProblem } from '@metro-fix/core-types';
import { UserEntity, CustomerEntity } from '../entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    // Optional so the service can be built without them (unit tests); the defaults then apply.
    @Optional() private readonly settings?: SettingsService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  private async securitySettings() {
    return (await this.settings?.get())?.security ?? DEFAULT_APP_SETTINGS.security;
  }

  /** Throws a readable error if the password breaks the policy set under Settings > Security. */
  private async assertPasswordPolicy(password: string): Promise<void> {
    const { passwordMinLength } = await this.securitySettings();
    const problem = passwordPolicyProblem(password, passwordMinLength);
    if (problem) throw new BadRequestException(problem);
  }

  async validateUser(email: string, pass: string): Promise<UserEntity> {
    // `password` is select:false on the entity, so ask for it here (and only here).
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // A locked account is refused before the password is even checked, so guessing cannot continue.
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutes = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000));
      throw new UnauthorizedException(`Too many failed sign-ins. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      const { maxFailedLogins, lockoutMinutes } = await this.securitySettings();
      if (maxFailedLogins > 0) {
        const count = (user.failedLoginCount ?? 0) + 1;
        if (count >= maxFailedLogins) {
          await this.userRepository.update(user.id, {
            failedLoginCount: 0,
            lockedUntil: new Date(Date.now() + lockoutMinutes * 60000),
          });
          await this.audit?.record({
            actor: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
            action: 'auth.lockout',
            target: user.email,
            detail: { failedAttempts: count, lockoutMinutes },
          });
        } else {
          await this.userRepository.update(user.id, { failedLoginCount: count });
        }
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Only someone who knows the password learns the account is switched off.
    if (user.isActive === false) {
      throw new UnauthorizedException('This account has been deactivated. Please contact support.');
    }

    await this.userRepository.update(user.id, { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() });
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.sessionFor(user);
  }

  private sessionFor(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        mustChangePassword: user.mustChangePassword === true,
      },
    };
  }

  /**
   * Customer self-registration. The role is always CUSTOMER (never taken from the request), and the
   * new account gets a customer profile with the entry tier; facility details are set per request.
   * Returns a signed-in session so the app can go straight in.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    await this.assertPasswordPolicy(dto.password);

    const user = await this.userRepository.manager.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(UserEntity, {
          fullName: dto.fullName.trim(),
          email,
          phoneNumber: dto.phoneNumber.trim(),
          password: dto.password,
          role: Role.CUSTOMER,
        }),
      );
      await manager.save(
        manager.create(CustomerEntity, {
          userId: created.id,
          facilityType: FacilityType.RESIDENTIAL,
          // No plan yet: the account is a lead until they subscribe (or skip and subscribe later).
          subscriptionTier: null,
          address: dto.address?.trim() || null,
        }),
      );
      return created;
    });

    return this.sessionFor(user);
  }

  async getProfile(userId: string): Promise<Partial<UserEntity>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: any): Promise<Partial<UserEntity>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.email) user.email = dto.email;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;

    if (dto.password && dto.password.trim() !== '') {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.userRepository.save(user);
    const { password, ...result } = updated;
    return result;
  }

  /** Changes the signed-in user's own password; the current one must be right. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Your current password is not right.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('Choose a password different from the current one.');
    }
    await this.assertPasswordPolicy(newPassword);
    await this.userRepository.update(user.id, {
      password: await bcrypt.hash(newPassword, 10),
      mustChangePassword: false,
    });
    await this.audit?.record({
      actor: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      action: 'auth.change-password',
      target: user.email,
    });
  }
}
