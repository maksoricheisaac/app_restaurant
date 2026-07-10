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
        (req as any).user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          platformRole: decoded.platformRole,
          tenantId: decoded.tenantId,
        };
      } catch {
        // Token invalide, on laisse passer pour que les Guards fassent leur travail
      }
    }

    next();
  }
}
