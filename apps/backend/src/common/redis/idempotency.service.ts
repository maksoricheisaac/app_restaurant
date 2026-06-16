import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Cross-instance idempotency guard. Backed by Redis SETNX+EX when REDIS_URL
 * is configured (safe for multi-instance deployments); falls back to an
 * in-memory map (single instance only, lost on restart) otherwise.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly memoryStore = new Map<string, number>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Atomically marks `key` as processed.
   * Returns `true` the first time a given key is seen (caller should
   * proceed), `false` if it was already marked within `ttlSeconds`
   * (caller should treat it as a duplicate and skip).
   */
  async checkAndMark(key: string, ttlSeconds: number): Promise<boolean> {
    const client = this.redisService.getClient();
    if (client) {
      try {
        const result = await client.set(key, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (err) {
        this.logger.warn(
          `Redis idempotency check failed for "${key}" — falling back to in-memory: ${(err as Error).message}`,
        );
      }
    }
    return this.checkAndMarkInMemory(key, ttlSeconds);
  }

  private checkAndMarkInMemory(key: string, ttlSeconds: number): boolean {
    this.evictStale();
    if (this.memoryStore.has(key)) return false;
    this.memoryStore.set(key, Date.now() + ttlSeconds * 1000);
    return true;
  }

  private evictStale(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.memoryStore) {
      if (expiresAt < now) this.memoryStore.delete(key);
    }
  }
}
