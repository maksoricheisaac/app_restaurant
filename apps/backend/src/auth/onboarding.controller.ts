import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import express from 'express';
import { OnboardingService } from './onboarding.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { InitiateRegistrationDto } from './dto/initiate-registration.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { COOKIE_OPTS_BASE } from '../common/constants/cookie.constants';

@Controller('/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
    long: { limit: 20, ttl: 60_000 * 60 },
  })
  @Post('initiate')
  async initiateRegistration(
    @Body() dto: InitiateRegistrationDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.onboardingService.initiateRegistration(dto);

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

    return { user: result.user };
  }

  @UseGuards(AuthGuard)
  @Post('complete')
  async completeOnboarding(
    @Request() req,
    @Body() dto: CompleteOnboardingDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.onboardingService.completeOnboarding(
      req.user.id,
      dto,
    );

    if (result.access_token && result.refresh_token) {
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
    }

    const { access_token: _a, refresh_token: _r, ...safeResult } = result;
    return safeResult;
  }

  @Public()
  @Get('check-slug')
  checkSlug(@Query('slug') slug: string) {
    if (!slug) return { available: false };
    return this.onboardingService.checkSlugAvailability(slug);
  }
}
