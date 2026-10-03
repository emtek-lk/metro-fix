import { Controller, Post, Get, Patch, Body, Req, UsePipes } from '@nestjs/common';
import { loginSchema } from '@metro-fix/core-types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from './public.decorator';
import { registerSchema, RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema as any))
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Customer self-registration (public). Always creates a CUSTOMER account. */
  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
