import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RevenueModule } from '../common/revenue/revenue.module';

@Module({
  imports: [PrismaModule, AuthModule, RevenueModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
