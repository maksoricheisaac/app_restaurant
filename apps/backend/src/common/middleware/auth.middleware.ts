import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let token: string | null = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        // Identité seulement. Le rôle effectif est relu en base par AuthGuard —
        // un claim de rôle périmé ne doit jamais accorder d'accès.
        (req as any).user = {
          id: decoded.sub,
          email: decoded.email,
        };
      } catch {
        // Token invalide, on laisse passer pour que les Guards fassent leur travail
      }
    }

    next();
  }
}
