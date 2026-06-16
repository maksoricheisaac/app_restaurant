import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { IdempotencyService } from './idempotency.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, IdempotencyService],
  exports: [RedisService, IdempotencyService],
})
export class RedisModule {}
