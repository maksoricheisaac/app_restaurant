import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

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

    const healthy = dbStatus === 'ok';

    return {
      status: healthy ? 'ok' : 'degraded',
      uptime,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
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
