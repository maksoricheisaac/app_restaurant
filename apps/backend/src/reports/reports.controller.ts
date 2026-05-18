import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/reports')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('metrics')
  @Roles('owner', 'manager')
  getMetrics(
    @CurrentTenant() tenant: Tenant,
    @Query('type') type?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getMetrics(tenant.id, type ?? 'monthly', date);
  }

  @Get('chart-data')
  @Roles('owner', 'manager')
  getChartData(
    @CurrentTenant() tenant: Tenant,
    @Query('type') type?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getChartData(tenant.id, type ?? 'monthly', date);
  }
}
