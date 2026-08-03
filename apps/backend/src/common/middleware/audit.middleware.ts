import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/reset-password',
  '/setup', // première installation — événement unique et sensible
  '/restaurant', // configuration de l'établissement
  '/permissions/',
  '/staff/', // gestion de l'équipe
  '/invites/', // acceptation d'invitation = création de compte
  '/cash-register/payment', // paiements — traçabilité comptable
  '/orders/', // commandes — traçabilité métier
];

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
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          durationMs: Date.now() - start,
        }),
      );
    });

    next();
  }
}
