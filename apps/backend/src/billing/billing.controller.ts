import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import type { Tenant } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Controller('/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles('owner')
  @Post('checkout')
  async createCheckout(
    @CurrentTenant() tenant: Tenant,
    @Body('plan') plan: string,
  ) {
    const returnUrl =
      this.config.get('FRONTEND_URL') ?? 'http://localhost:4000';
    return this.billingService.createCheckoutSession(
      tenant.id,
      plan ?? 'pro',
      returnUrl,
    );
  }

  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles('owner', 'manager')
  @Get('status')
  async getStatus(@CurrentTenant() tenant: Tenant) {
    return this.billingService.getStatus(tenant.id);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-signature') sig: string,
  ) {
    await this.billingService.handleWebhook(
      (req as any).rawBody as Buffer,
      sig,
    );
    return { received: true };
  }
}
