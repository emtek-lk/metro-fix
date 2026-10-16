import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** What a user with a one-time password may still call: read their profile and change the password. */
const PASSWORD_SETUP_ROUTES = new Set(['GET /auth/me', 'POST /auth/change-password']);
const routeKey = (req: { method?: string; originalUrl?: string; url?: string }) =>
  `${(req.method ?? '').toUpperCase()} ${(req.originalUrl ?? req.url ?? '').split('?')[0].replace(/\/+$/, '')}`;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: { method?: string; originalUrl?: string; url?: string }, payload: JwtPayload) {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    // Switching an account off ends its existing sessions too, not just new sign-ins.
    if (user.isActive === false) {
      throw new UnauthorizedException('This account has been deactivated.');
    }
    // A one-time password only opens the door to choosing a real one.
    if (user.mustChangePassword === true && !PASSWORD_SETUP_ROUTES.has(routeKey(req))) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Choose a new password before continuing.',
      });
    }
    return user;
  }
}
