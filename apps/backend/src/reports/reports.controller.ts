import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('/reports')
@UseGuards(AuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('metrics')
  @Roles('owner', 'manager')
  getMetrics(
    @Query('type') type?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getMetrics(type ?? 'monthly', date);
  }

  @Get('chart-data')
  @Roles('owner', 'manager')
  getChartData(
    @Query('type') type?: 'daily' | 'weekly' | 'monthly' | 'yearly',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getChartData(type ?? 'monthly', date);
  }
}
