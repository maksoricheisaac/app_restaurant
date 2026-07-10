import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  context?: string;
  extra?: Record<string, unknown>;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * Capture an exception with structured context.
   * Sends to Sentry when enabled; always writes a structured log.
   */
  captureError(error: unknown, ctx?: ErrorContext): void {
    const err = error instanceof Error ? error : new Error(String(error));

    this.logger.error(
      JSON.stringify({
        event: 'captured_error',
        message: err.message,
        requestId: ctx?.requestId,
        userId: ctx?.userId,
        tenantId: ctx?.tenantId,
        context: ctx?.context,
        extra: ctx?.extra,
        stack: this.isProduction ? undefined : err.stack,
      }),
    );

    if (Sentry.isEnabled()) {
      Sentry.withScope((scope) => {
        if (ctx?.userId) scope.setUser({ id: ctx.userId });
        if (ctx?.tenantId) scope.setTag('tenantId', ctx.tenantId);
        if (ctx?.context) scope.setTag('context', ctx.context);
        if (ctx?.extra) scope.setExtras(ctx.extra);
        if (ctx?.requestId) scope.setTag('requestId', ctx.requestId);
        Sentry.captureException(err);
      });
    }
  }

  /**
   * Capture a business-critical warning (quota exceeded, billing issue, etc.)
   */
  captureWarning(message: string, ctx?: ErrorContext): void {
    this.logger.warn(
      JSON.stringify({
        event: 'business_warning',
        message,
        requestId: ctx?.requestId,
        userId: ctx?.userId,
        tenantId: ctx?.tenantId,
        context: ctx?.context,
      }),
    );

    if (Sentry.isEnabled()) {
      Sentry.withScope((scope) => {
        if (ctx?.userId) scope.setUser({ id: ctx.userId });
        if (ctx?.tenantId) scope.setTag('tenantId', ctx.tenantId);
        if (ctx?.context) scope.setTag('context', ctx.context);
        if (ctx?.requestId) scope.setTag('requestId', ctx.requestId);
        Sentry.captureMessage(message, 'warning');
      });
    }
  }
}
