import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('/dashboard')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('owner', 'manager', 'chef', 'cashier')
  getStats(@Query('date') date: string) {
    return this.dashboardService.getStats(date || new Date().toISOString());
  }

  @Get('recent-orders')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'chef')
  getRecentOrders() {
    return this.dashboardService.getRecentOrders();
  }

  @Get('sidebar-counts')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'chef')
  getSidebarCounts() {
    return this.dashboardService.getSidebarCounts();
  }
}
