import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PublicMenuController } from './public-menu.controller';
import { PublicOrderService } from './public-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, AuthModule, GatewayModule, PlansModule],
  controllers: [MenuController, PublicMenuController],
  providers: [MenuService, PublicOrderService],
  exports: [MenuService],
})
export class MenuModule {}
