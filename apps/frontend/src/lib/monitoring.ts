/**
 * Monitoring abstraction — Sentry-ready.
 *
 * Activation Sentry:
 *   1. pnpm add @sentry/nextjs
 *   2. npx @sentry/wizard@latest -i nextjs  (generates sentry.*.config.ts files)
 *   3. Set NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT in .env
 *   4. Uncomment the Sentry blocks below
 *
 * Reference: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

interface ErrorContext {
  userId?: string;
  context?: string;
  extra?: Record<string, unknown>;
}

interface BreadcrumbContext {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

const isDev = process.env.NODE_ENV === 'development';

export const monitoring = {
  captureError(error: Error | unknown, ctx?: ErrorContext): void {
    const err = error instanceof Error ? error : new Error(String(error));

    if (isDev) {
      console.error('[monitoring]', err.message, ctx ?? '');
    } else {
      console.error(
        JSON.stringify({
          event: 'frontend_error',
          message: err.message,
          userId: ctx?.userId,
          context: ctx?.context,
        }),
      );
    }

    // ── Sentry (uncomment after pnpm add @sentry/nextjs) ─────────────────
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.withScope((scope) => {
    //   if (ctx?.userId) scope.setUser({ id: ctx.userId });
    //   if (ctx?.context) scope.setTag('context', ctx.context);
    //   if (ctx?.extra) scope.setExtras(ctx.extra);
    //   Sentry.captureException(err);
    // });
  },

  addBreadcrumb(ctx: BreadcrumbContext): void {
    if (isDev) {
      console.debug('[monitoring]', ctx.category, ctx.message);
    }
    // Sentry.addBreadcrumb({ category: ctx.category, message: ctx.message, level: ctx.level, data: ctx.data });
  },

  setUser(user: { id: string; email: string } | null): void {
    if (isDev) {
      console.debug('[monitoring] setUser', user?.id ?? 'logout');
    }
    // user ? Sentry.setUser({ id: user.id, email: user.email }) : Sentry.setUser(null);
  },

  measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      if (isDev && duration > 500) {
        console.warn(`[monitoring] ${name} took ${duration.toFixed(0)}ms`);
      }
    });
  },
};
