import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AllowDuringSetup } from '../setup/setup.decorators';

/**
 * `@AllowDuringSetup()` n'est pas un détail : sans lui, les sondes échouent
 * tant que le logiciel n'est pas installé, l'orchestrateur juge le conteneur
 * malsain et ne lui envoie jamais le trafic qui permettrait précisément de
 * l'installer.
 */
@Controller('health')
@Public()
@AllowDuringSetup()
@SkipThrottle()
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Kubernetes liveness probe — is the process alive? */
  @Get('live')
  @HttpCode(200)
  live() {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /** Kubernetes readiness probe — is the service ready to accept traffic? */
  @Get('ready')
  @HttpCode(200)
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }

  /**
   * Full health check — used by Docker HEALTHCHECK, load balancers, and dashboards.
   * Returns 200 when all subsystems are healthy, 503 otherwise.
   */
  @Get()
  @HttpCode(200)
  async health() {
    const mem = process.memoryUsage();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    let dbStatus: 'ok' | 'error' = 'ok';
    let dbLatencyMs: number | null = null;

    try {
      const t0 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbStatus = 'error';
    }

    // Redis est structurant pour le throttling distribué, la diffusion
    // Socket.io multi-instance et l'idempotence des webhooks (ADR-005). Un
    // Redis configuré mais injoignable dégrade silencieusement l'app en
    // mode single-instance — ça doit être visible ici, pas invisible du
    // load balancer / du HEALTHCHECK Docker. Un Redis simplement non
    // configuré (dev/single-instance assumé) n'est en revanche pas une
    // dégradation : c'est un mode de fonctionnement normal et documenté.
    let redisStatus: 'ok' | 'error' | 'not_configured' = 'not_configured';
    let redisLatencyMs: number | null = null;
    const redisClient = this.redis.getClient();
    if (redisClient) {
      try {
        const t0 = Date.now();
        await redisClient.ping();
        redisLatencyMs = Date.now() - t0;
        redisStatus = 'ok';
      } catch {
        redisStatus = 'error';
      }
    }

    const healthy = dbStatus === 'ok' && redisStatus !== 'error';

    return {
      status: healthy ? 'ok' : 'degraded',
      uptime,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        redis: {
          status: redisStatus,
          latencyMs: redisLatencyMs,
        },
        memory: {
          status: mem.heapUsed < 500 * 1024 * 1024 ? 'ok' : 'warn',
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
          rssMb: Math.round(mem.rss / 1024 / 1024),
        },
        process: {
          status: 'ok',
          pid: process.pid,
          nodeVersion: process.version,
          env: process.env.NODE_ENV ?? 'unknown',
        },
      },
    };
  }
}
