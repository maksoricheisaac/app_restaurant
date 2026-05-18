import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/dashboard')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('owner', 'manager', 'head_chef', 'cashier')
  getStats(@CurrentTenant() tenant: Tenant, @Query('date') date: string) {
    return this.dashboardService.getStats(
      tenant.id,
      date || new Date().toISOString(),
    );
  }

  @Get('recent-orders')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'head_chef', 'chef')
  getRecentOrders(@CurrentTenant() tenant: Tenant) {
    return this.dashboardService.getRecentOrders(tenant.id);
  }

  @Get('sidebar-counts')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'head_chef', 'chef')
  getSidebarCounts(
    @CurrentTenant() tenant: Tenant | undefined,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getSidebarCounts(tenant?.id, user);
  }

  @Get('platform-stats')
  @Roles('super_admin')
  getPlatformStats() {
    return this.dashboardService.getPlatformStats();
  }
}
