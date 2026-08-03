import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Vérifie le rôle de l'appelant contre `@Roles(...)`.
 *
 * Purement en mémoire : `AuthGuard` a déjà chargé le compte et son rôle à jour.
 * Il n'y a plus ni requête SQL, ni membership, ni rôle plateforme à arbitrer —
 * le rôle est une propriété du compte, pas d'une relation.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;

    if (!user) {
      throw new ForbiddenException('Session introuvable');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Rôles requis : ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
