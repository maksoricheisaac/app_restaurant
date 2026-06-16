import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PublicMenuController } from './public-menu.controller';
import { PublicOrderService } from './public-orders.service';
import { MenuSessionService } from './menu-session.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { PlansModule } from '../plans/plans.module';
import { BlobModule } from '../blob/blob.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, GatewayModule, PlansModule, BlobModule],
  controllers: [MenuController, PublicMenuController],
  providers: [MenuService, PublicOrderService, MenuSessionService],
  exports: [MenuService],
})
export class MenuModule {}
