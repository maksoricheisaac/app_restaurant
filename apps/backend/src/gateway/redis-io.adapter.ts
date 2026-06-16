import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

/**
 * Socket.io adapter that fans out events through Redis pub/sub when
 * REDIS_URL is configured, enabling multi-instance deployments (rooms and
 * broadcasts work across pods). Falls back to the default in-memory adapter
 * (single instance only) when REDIS_URL is absent or unreachable.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(
    app: ConstructorParameters<typeof IoAdapter>[0],
    private readonly redisUrl?: string,
  ) {
    super(app);
  }

  connectToRedis(): void {
    if (!this.redisUrl) {
      this.logger.warn(
        'REDIS_URL not set — Socket.io running in single-instance (in-memory) mode',
      );
      return;
    }

    try {
      this.pubClient = new Redis(this.redisUrl, { maxRetriesPerRequest: 1 });
      this.subClient = this.pubClient.duplicate();
      this.pubClient.on('error', (err) =>
        this.logger.warn(`Redis pub client error: ${err.message}`),
      );
      this.subClient.on('error', (err) =>
        this.logger.warn(`Redis sub client error: ${err.message}`),
      );
      this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
      this.logger.log(
        'Socket.io configured with Redis adapter (multi-instance ready)',
      );
    } catch (err) {
      this.logger.warn(
        `Redis adapter setup failed — falling back to in-memory: ${(err as Error).message}`,
      );
      this.adapterConstructor = undefined;
    }
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
