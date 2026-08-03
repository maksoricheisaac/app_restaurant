import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderCreationService } from './order-creation.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GatewayModule,
    CustomersModule,
    InventoryModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderCreationService],
  // OrderCreationService est exporté pour le canal public (MenuModule) :
  // c'est le chemin unique de création d'une commande.
  exports: [OrdersService, OrderCreationService],
})
export class OrdersModule {}
