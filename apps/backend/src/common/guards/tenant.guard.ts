import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 1. Résolution du Tenant via Header ou Sous-domaine
    const tenantId = request.headers['x-tenant-id'];
    const tenantSlug = request.headers['x-tenant-slug'];

    if (!tenantId && !tenantSlug) {
      if (isPublic) return true;
      
      // Si c'est un super_admin avec une session valide, on peut laisser passer
      // (Le AuthMiddleware a déjà injecté request.user si le token était présent)
      if (request.user?.platformRole === 'super_admin') {
        return true;
      }
      
      throw new ForbiddenException('Tenant identification missing');
    }

    // 2. Vérification de l'existence du Tenant
    const tenant = await this.prisma.tenant.findFirst({
      where: tenantId ? { id: tenantId } : { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    request.tenant = tenant;

    // 3. Vérification du Membership pour les routes non-publiques
    if (!isPublic) {
      const user = request.user;
      if (!user) throw new ForbiddenException('User not authenticated');

      const membership = await this.prisma.tenantMembership.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: tenant.id,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException('You do not belong to this tenant');
      }

      request.membership = membership;
    }

    return true;
  }
}
