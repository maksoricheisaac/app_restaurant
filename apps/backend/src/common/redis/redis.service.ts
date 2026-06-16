import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Shared Redis client for cross-instance coordination (webhook idempotency,
 * Socket.io adapter, etc.). Degrades gracefully to `null` when REDIS_URL is
 * not configured — callers must handle the single-instance fallback.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    if (!url) {
      this.client = null;
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });
  }

  /** Returns the shared ioredis client, or `null` if REDIS_URL is not set. */
  getClient(): Redis | null {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }
}
