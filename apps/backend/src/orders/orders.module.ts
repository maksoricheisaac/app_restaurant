import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderCreationService } from './order-creation.service';
import { OrderTicketService } from './order-ticket.service';
import { OrderLinePricingService } from './order-line-pricing.service';
import { OrderNumberingService } from './order-numbering.service';
import { TaxRateResolverService } from './tax-rate-resolver.service';
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
  providers: [
    OrdersService,
    OrderCreationService,
    OrderTicketService,
    OrderLinePricingService,
    OrderNumberingService,
    TaxRateResolverService,
  ],
  // OrderCreationService est exporté pour le canal public (MenuModule) :
  // c'est le chemin unique de création d'une commande. OrderTicketService
  // l'est pour la caisse, qui doit verrouiller un ticket à l'encaissement.
  exports: [OrdersService, OrderCreationService, OrderTicketService],
})
export class OrdersModule {}
