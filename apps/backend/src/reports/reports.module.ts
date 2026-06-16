import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [PrismaModule, AuthModule, FeatureFlagsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
