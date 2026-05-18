import { Module } from '@nestjs/common';
import { PlanLimitService } from './plans.service';
import { PlansController } from './plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [PlanLimitService],
  exports: [PlanLimitService],
})
export class PlansModule {}
