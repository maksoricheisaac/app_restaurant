import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PublicMenuController } from './public-menu.controller';
import { PublicOrderService } from './public-orders.service';
import { MenuSessionService } from './menu-session.service';
import { MenuOptionsService } from './menu-options.service';
import { MenuOptionsController } from './menu-options.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { PlansModule } from '../plans/plans.module';
import { BlobModule } from '../blob/blob.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    GatewayModule,
    PlansModule,
    BlobModule,
    InventoryModule,
    ReservationsModule,
    CustomersModule,
  ],
  controllers: [MenuController, PublicMenuController, MenuOptionsController],
  providers: [
    MenuService,
    PublicOrderService,
    MenuSessionService,
    MenuOptionsService,
  ],
  exports: [MenuService],
})
export class MenuModule {}
