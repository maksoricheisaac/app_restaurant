import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Authentifie la requête et charge le compte appelant.
 *
 * Une seule requête SQL, et elle remplace les deux que faisait l'ancienne
 * chaîne multi-tenant (résolution du tenant, puis du membership). Le rôle est
 * relu en base à chaque appel plutôt que d'être cru sur parole depuis le JWT :
 * une rétrogradation, une désactivation ou un bannissement prend effet
 * immédiatement, sans attendre l'expiration du jeton d'accès.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!request.user?.id) {
      throw new UnauthorizedException('Session invalide ou expirée');
    }

    const account = await this.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Session invalide ou expirée');
    }

    if (account.status !== 'active') {
      throw new ForbiddenException('Ce compte est désactivé');
    }

    // Le compte en base fait foi : les claims du JWT ne servent qu'à
    // identifier l'appelant, jamais à décider de ses droits.
    request.user = { ...request.user, ...account };

    return true;
  }
}
