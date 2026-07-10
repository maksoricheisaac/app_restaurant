/**
 * Sentry instrumentation bootstrap.
 *
 * THIS FILE MUST BE IMPORTED FIRST in main.ts — before any other import.
 * Sentry needs to patch Node.js modules (http, https, Express) before they are
 * loaded by other modules. A late import breaks automatic tracing.
 *
 * Activation checklist:
 *   1. Set SENTRY_DSN in apps/backend/.env
 *   2. Restart the backend — Sentry logs "Sentry initialized" on boot
 *   3. Hit GET /api/v1/sentry-test → event should appear in Sentry within ~30 s
 *
 * When SENTRY_DSN is absent the SDK is disabled (enabled: false) and has zero
 * runtime overhead — no requests are made, no data is collected.
 */
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,

  // Disabled entirely when DSN is absent — zero-cost in development.
  enabled: !!dsn,

  environment: process.env.NODE_ENV ?? 'development',

  integrations: [
    // NestJS-specific instrumentation: decorates spans with controller/route info.
    Sentry.nestIntegration(),
    // Express instrumentation: traces middleware and route handlers.
    Sentry.expressIntegration(),
  ],

  // 10 % of transactions traced in production; 100 % in development/staging.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  beforeSend(event) {
    // Strip sensitive headers — must never appear in third-party error reports.
    const headers = event.request?.headers;
    if (headers) {
      delete headers['authorization'];
      delete headers['cookie'];
      delete headers['x-api-key'];
    }
    return event;
  },
});

if (dsn) {
  console.log(
    '[Sentry] Initialized — env:',
    process.env.NODE_ENV ?? 'development',
  );
}
