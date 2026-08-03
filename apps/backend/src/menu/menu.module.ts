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
import { RestaurantModule } from '../restaurant/restaurant.module';
import { BlobModule } from '../blob/blob.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    GatewayModule,
    RestaurantModule,
    BlobModule,
    InventoryModule,
    ReservationsModule,
    CustomersModule,
    // Fournit OrderCreationService : la commande publique et la commande au
    // comptoir empruntent le même chemin de création.
    OrdersModule,
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
