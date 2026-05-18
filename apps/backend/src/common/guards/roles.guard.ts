import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

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

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const membership = request.membership;

    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    // Un Super Admin plateforme outrepasse les rôles tenant et le membership
    if (user.platformRole === 'super_admin') {
      return true;
    }

    if (!membership) {
      throw new ForbiddenException('Membership not found');
    }

    // On vérifie le rôle dans le membership du tenant
    const hasRole = requiredRoles.includes(membership.role);

    if (!hasRole) {
      throw new ForbiddenException(`Rôles requis: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
