import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RestaurantController, SetupController],
  providers: [RestaurantService, SetupService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
