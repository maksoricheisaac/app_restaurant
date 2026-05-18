import {
  Controller,
  Post,
  Patch,
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
import { AccountTypeDto } from './dto/account-type.dto';
import { RestaurantInfoDto } from './dto/restaurant-info.dto';
import { SelectPlanDto } from './dto/select-plan.dto';
import { COOKIE_OPTS_BASE } from '../common/constants/cookie.constants';

@Controller('/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60_000 }, long: { limit: 20, ttl: 60_000 * 60 } })
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
  @Patch('step/account-type')
  saveAccountType(@Request() req, @Body() dto: AccountTypeDto) {
    return this.onboardingService.saveAccountType(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('step/restaurant-info')
  saveRestaurantInfo(@Request() req, @Body() dto: RestaurantInfoDto) {
    return this.onboardingService.saveRestaurantInfo(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('step/plan')
  savePlan(@Request() req, @Body() dto: SelectPlanDto) {
    return this.onboardingService.savePlan(req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Post('complete')
  async completeOnboarding(
    @Request() req,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.onboardingService.completeOnboarding(req.user.id);

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

  @UseGuards(AuthGuard)
  @Get('state')
  getState(@Request() req) {
    return this.onboardingService.getOnboardingState(req.user.id);
  }

  @Public()
  @Get('check-slug')
  checkSlug(@Query('slug') slug: string) {
    if (!slug) return { available: false };
    return this.onboardingService.checkSlugAvailability(slug);
  }
}
