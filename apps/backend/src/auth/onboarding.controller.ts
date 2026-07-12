import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { OnboardingService } from './onboarding.service';
import { Public } from '../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { COOKIE_OPTS_BASE } from '../common/constants/cookie.constants';

@Controller('/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * Inscription complète en un seul appel — crée le compte ET le restaurant
   * dans une transaction unique, puis ouvre la session (cookies). C'est le seul
   * point d'écriture du parcours : rien n'est persisté avant cet appel.
   */
  @Public()
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
    long: { limit: 20, ttl: 60_000 * 60 },
  })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.onboardingService.register(dto);

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

    return {
      success: result.success,
      user: result.user,
      tenant: result.tenant,
    };
  }

  @Public()
  @Get('check-slug')
  checkSlug(@Query('slug') slug: string) {
    if (!slug) return { available: false };
    return this.onboardingService.checkSlugAvailability(slug);
  }

  @Public()
  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    if (!email) return { available: false };
    return this.onboardingService.checkEmailAvailability(email);
  }
}
