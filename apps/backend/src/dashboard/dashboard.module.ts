import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardService } from './dashboard.service';
import { RevenueModule } from '../common/revenue/revenue.module';

@Module({
  imports: [PrismaModule, AuthModule, RevenueModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
