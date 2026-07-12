// ─── Sentry MUST be the first import ─────────────────────────────────────────
// Patches Node.js http/https and Express before any other module loads.
// Moving this import down breaks automatic instrumentation.
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DecimalTransformInterceptor } from './common/interceptors/decimal-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedisIoAdapter } from './gateway/redis-io.adapter';
import { setupExpressErrorHandler } from '@sentry/nestjs';
import * as Sentry from '@sentry/nestjs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

// ─── Global process safety handlers ──────────────────────────────────────────
// Catch unhandled promise rejections and uncaught exceptions before the NestJS
// app is even initialized — prevents silent crashes in production.

process.on('unhandledRejection', (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error(
    JSON.stringify({
      event: 'unhandledRejection',
      error: err.message,
      stack: err.stack,
    }),
  );
  Sentry.captureException(err);
  // Do NOT exit — allow the process to finish current requests.
  // Docker/K8s will restart if health check fails.
});

process.on('uncaughtException', (error: Error) => {
  logger.error(
    JSON.stringify({
      event: 'uncaughtException',
      error: error.message,
      stack: error.stack,
    }),
  );
  Sentry.captureException(error);
  // Flush Sentry buffer before exit — 2 s timeout to avoid hanging.
  void Sentry.flush(2000).finally(() => process.exit(1));
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // Structured JSON logs in production, pretty-print in development
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Graceful shutdown — handles SIGTERM from Docker / Kubernetes
  app.enableShutdownHooks();

  // Socket.io adapter — uses Redis pub/sub for multi-instance broadcasts
  // when REDIS_URL is configured, falls back to in-memory otherwise.
  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(
    app,
    configService.get<string>('REDIS_URL'),
  );
  redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(cookieParser());

  const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:4000';
  const wsOrigin = frontendOrigin.replace(/^http/, 'ws');
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", frontendOrigin, wsOrigin],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          // Prevent clickjacking at CSP level (complements X-Frame-Options header)
          frameAncestors: ["'none'"],
          // Force HTTPS for all sub-resources in production
          ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Prevent MIME-type sniffing (defence against polyglot upload attacks)
      noSniff: true,
      // Block IE8 XSS filter bypass
      xssFilter: true,
      // Disable X-Powered-By (already removed by Helmet by default)
      hidePoweredBy: true,
    }),
  );

  const allowedOrigins = isProduction
    ? ([process.env.FRONTEND_URL].filter(Boolean) as string[])
    : ([
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:4000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4000',
      ].filter(Boolean) as string[]);

  app.setGlobalPrefix('/api/v1/');
  app.enableCors({
    origin: allowedOrigins,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'x-tenant-slug',
      'x-request-id',
    ],
    exposedHeaders: ['x-request-id'],
    credentials: true,
    maxAge: 600,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new DecimalTransformInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,
    }),
  );

  // ─── Sentry Express error handler ────────────────────────────────────────────
  // Must be registered AFTER all NestJS middleware, guards, filters and pipes —
  // but BEFORE app.listen(). Catches Express-level errors that bypass the
  // NestJS exception layer (e.g. crashes in raw middleware).
  setupExpressErrorHandler(app.getHttpAdapter().getInstance());

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend Flash Menu running on: ${await app.getUrl()}`);
  logger.log(`Health: ${await app.getUrl()}/api/v1/health`);
}
bootstrap();
