import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

// AuthModule exports JwtModule — no need for a local JwtModule registration here.
// This eliminates the confusing signOptions: { expiresIn: '1d' } duplicate.
@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class GatewayModule {}
