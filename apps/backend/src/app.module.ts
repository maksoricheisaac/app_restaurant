import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerStorage,
} from '@nestjs/throttler';
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
import { MediaModule } from './media/media.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { AuditMiddleware } from './common/middleware/audit.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { JwtModule } from '@nestjs/jwt';
import { validateConfig } from './config/config.validation';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        // Redis store enables distributed rate limiting across multiple instances.
        // Requires: pnpm add ioredis (peer dep of @nest-lab/throttler-storage-redis).
        // Falls back silently to in-memory when REDIS_URL is absent or ioredis is missing.
        let storage: ThrottlerStorage | undefined;
        if (redisUrl) {
          try {
            // Dynamic import so a missing ioredis peer dep never hard-crashes the boot.
            const { ThrottlerStorageRedisService } =
              await import('@nest-lab/throttler-storage-redis');
            storage = new ThrottlerStorageRedisService(
              redisUrl,
            ) as ThrottlerStorage;
          } catch {
            console.warn(
              '[Throttler] Redis store unavailable — falling back to in-memory. Run: pnpm add ioredis',
            );
          }
        }

        return {
          throttlers: [
            { name: 'short', ttl: 60_000, limit: 30 },
            { name: 'long', ttl: 60_000 * 60, limit: 500 },
            // Public order submissions: max 5 per IP per hour (DoS / quota exhaustion protection)
            { name: 'orders', ttl: 60_000 * 60, limit: 5 },
          ],
          ...(storage ? { storage } : {}),
        };
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret)
          throw new Error('JWT_SECRET environment variable is required');
        return { secret, signOptions: { expiresIn: '15m' } };
      },
      inject: [ConfigService],
    }),
    RedisModule,
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
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
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
