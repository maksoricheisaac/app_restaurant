import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrdersModule } from './orders/orders.module';
import { MenuModule } from './menu/menu.module';
import { CategoriesModule } from './categories/categories.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReservationsModule } from './reservations/reservations.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { TablesModule } from './tables/tables.module';
import { CustomersModule } from './customers/customers.module';
import { SettingsModule } from './settings/settings.module';
import { MessagesModule } from './messages/messages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GatewayModule } from './gateway/gateway.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ReportsModule } from './reports/reports.module';
import { BillingModule } from './billing/billing.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { PlansModule } from './plans/plans.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { AuditMiddleware } from './common/middleware/audit.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { JwtModule } from '@nestjs/jwt';
import { validateConfig } from './config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'long', ttl: 60_000 * 60, limit: 500 },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET environment variable is required');
        return { secret, signOptions: { expiresIn: '15m' } };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    MembershipsModule,
    OrdersModule,
    MenuModule,
    CategoriesModule,
    InventoryModule,
    ReservationsModule,
    CashRegisterModule,
    TablesModule,
    CustomersModule,
    SettingsModule,
    MessagesModule,
    DashboardModule,
    GatewayModule,
    PermissionsModule,
    ReportsModule,
    BillingModule,
    MailModule,
    HealthModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // RequestId first — all subsequent middleware and handlers can read requestId
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
