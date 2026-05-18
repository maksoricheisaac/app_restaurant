import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_PATHS = ['/auth/login', '/auth/logout', '/billing/', '/tenants/', '/permissions/'];

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuditLog');

  use(req: Request, res: Response, next: NextFunction) {
    const isSensitive = SENSITIVE_PATHS.some((p) => req.path.includes(p));
    if (!isSensitive) return next();

    const user = (req as any).user;
    const start = Date.now();

    res.on('finish', () => {
      this.logger.log(
        JSON.stringify({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userId: user?.id ?? 'anonymous',
          tenantId: req.headers['x-tenant-id'] ?? null,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          durationMs: Date.now() - start,
        }),
      );
    });

    next();
  }
}
