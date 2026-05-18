import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Structured request/response logging interceptor.
 *
 * Emits one JSON log line per request containing:
 * - requestId, method, path, statusCode, durationMs
 * - userId, tenantId (if authenticated)
 *
 * Skips health check endpoints to avoid log spam.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly SKIP_PATHS = new Set(['/api/v1/health', '/api/v1/health/live', '/api/v1/health/ready']);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    if (this.SKIP_PATHS.has(req.path)) {
      return next.handle();
    }

    const start = Date.now();
    const requestId = (req as any).requestId as string | undefined;

    return next.handle().pipe(
      tap({
        next: () => this.log(req, res, start, requestId),
        error: () => this.log(req, res, start, requestId),
      }),
    );
  }

  private log(req: Request, res: Response, start: number, requestId?: string) {
    const user = (req as any).user;
    this.logger.log(
      JSON.stringify({
        event: 'http_request',
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        userId: user?.id ?? null,
        tenantId: req.headers['x-tenant-id'] ?? null,
        ip: req.ip,
      }),
    );
  }
}
