import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role, FacilityType, SubscriptionTier } from '@metro-fix/core-types';
import { UserEntity, CustomerEntity } from '../entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

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
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }
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
          subscriptionTier: SubscriptionTier.ACCESS,
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
}
