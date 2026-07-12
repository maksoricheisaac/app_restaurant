import { Module } from '@nestjs/common';
import { PlanLimitService } from './plans.service';
import { PlansService } from './plans.catalog.service';
import { PlansController } from './plans.controller';
import { PublicPlansController } from './public-plans.controller';
import { AdminPlansController } from './admin-plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlansController, PublicPlansController, AdminPlansController],
  providers: [PlanLimitService, PlansService],
  exports: [PlanLimitService, PlansService],
})
export class PlansModule {}
