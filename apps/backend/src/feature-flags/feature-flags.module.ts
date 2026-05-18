import { Module } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, PlansModule],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
