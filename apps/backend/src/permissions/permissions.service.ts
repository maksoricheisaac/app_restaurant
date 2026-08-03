import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StaffRole } from '../common/constants/staff-roles.constant';
import {
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
} from './default-role-permissions';
import {
  UpdateRolePermissionsDto,
  SetUserPermissionDto,
} from './dto/permissions.dto';

/**
 * Permissions effectives de l'équipe.
 *
 * Deux niveaux, dans cet ordre : les permissions du rôle (`RolePermission`),
 * puis les dérogations individuelles (`UserPermission`) qui peuvent en
 * accorder une de plus ou en retirer une.
 */
@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /** Catalogue complet, pour l'écran de configuration des rôles. */
  getCatalog() {
    return {
      permissions: Object.values(Permission),
      roles: Object.entries(ROLE_LABELS).map(([key, label]) => ({
        key,
        label,
      })),
    };
  }

  async getRolePermissions(role: StaffRole) {
    const stored = await this.prisma.rolePermission.findUnique({
      where: { role },
    });
    return {
      role,
      permissions: stored?.permissions ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [],
    };
  }

  getAllRolePermissions() {
    return this.prisma.rolePermission.findMany({ orderBy: { role: 'asc' } });
  }

  updateRolePermissions(role: StaffRole, data: UpdateRolePermissionsDto) {
    const permissions = data.permissions;
    return this.prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });
  }

  /** Remet un rôle sur ses permissions d'usine. */
  resetRolePermissions(role: StaffRole) {
    const permissions = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
    return this.prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });
  }

  // ─── Dérogations individuelles ────────────────────────────────────────────

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    if (!user) throw new NotFoundException("Membre d'équipe introuvable");

    const [rolePermissions, overrides] = await Promise.all([
      this.getRolePermissions(user.role as StaffRole),
      this.prisma.userPermission.findMany({ where: { userId } }),
    ]);

    const effective = new Set<Permission>(rolePermissions.permissions);
    for (const override of overrides) {
      if (override.granted) effective.add(override.permission);
      else effective.delete(override.permission);
    }

    return {
      user,
      rolePermissions: rolePermissions.permissions,
      overrides,
      effective: [...effective],
    };
  }

  async setUserPermission(userId: string, data: SetUserPermissionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Membre d'équipe introuvable");

    return this.prisma.userPermission.upsert({
      where: {
        userId_permission: { userId, permission: data.permission },
      },
      update: { granted: data.granted },
      create: { userId, permission: data.permission, granted: data.granted },
    });
  }

  /** Retire la dérogation : la personne repasse sur les droits de son rôle. */
  clearUserPermission(userId: string, permission: Permission) {
    return this.prisma.userPermission.deleteMany({
      where: { userId, permission },
    });
  }
}
