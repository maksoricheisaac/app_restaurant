import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlanLimitService } from './plans.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/plans')
@UseGuards(AuthGuard, TenantGuard)
export class PlansController {
  constructor(private readonly planLimitService: PlanLimitService) {}

  /** Returns plan usage summary for the current tenant — used by dashboard and upgrade prompts. */
  @Get('usage')
  getUsage(@CurrentTenant() tenant: Tenant) {
    return this.planLimitService.getUsageSummary(tenant.id);
  }
}
