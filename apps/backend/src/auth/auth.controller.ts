import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendVerificationDto,
} from './dto/forgot-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { COOKIE_OPTS_BASE } from '../common/constants/cookie.constants';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({
    short: { limit: 5, ttl: 60_000 },
    long: { limit: 20, ttl: 60_000 * 60 },
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(req.user);

    res.cookie('token', result.access_token, {
      ...COOKIE_OPTS_BASE,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie('refreshToken', result.refresh_token, {
      ...COOKIE_OPTS_BASE,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    });

    return { user: result.user };
  }

  @Public()
  @Throttle({
    short: { limit: 10, ttl: 60_000 },
    long: { limit: 50, ttl: 60_000 * 60 },
  })
  @Post('refresh')
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const rawToken: string | undefined = req.cookies?.refreshToken;
    if (!rawToken) throw new UnauthorizedException('Refresh token manquant');

    const result = await this.authService.refreshAccessToken(rawToken);

    res.cookie('token', result.access_token, {
      ...COOKIE_OPTS_BASE,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refresh_token, {
      ...COOKIE_OPTS_BASE,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { ok: true };
  }

  @Post('logout')
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const rawToken: string | undefined = req.cookies?.refreshToken;
    if (rawToken) await this.authService.revokeRefreshToken(rawToken);

    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return { message: 'Déconnecté' };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Public()
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    if (!token) throw new UnauthorizedException('Token manquant');
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    long: { limit: 10, ttl: 60_000 * 60 },
  })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Public()
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    long: { limit: 10, ttl: 60_000 * 60 },
  })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
    long: { limit: 10, ttl: 60_000 * 60 },
  })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
