import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffRole,
  isSuperAdmin,
} from '../common/constants/staff-roles.constant';
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
const ALL_PERMISSIONS = Object.values(Permission);

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Catalogue complet, pour l'écran de configuration des rôles.
   *
   * Le compte racine en est absent : ses permissions ne se configurent pas, et
   * afficher une ligne qu'on ne peut ni cocher ni décocher n'apprendrait rien
   * à personne.
   */
  getCatalog() {
    return {
      permissions: ALL_PERMISSIONS,
      roles: Object.entries(ROLE_LABELS)
        .filter(([key]) => !isSuperAdmin(key))
        .map(([key, label]) => ({ key, label })),
    };
  }

  async getRolePermissions(role: StaffRole) {
    // Le compte racine a toutes les permissions, quoi que contienne la table :
    // une ligne `RolePermission` obsolète ou trafiquée ne doit pas pouvoir le
    // priver de ses droits.
    if (isSuperAdmin(role)) {
      return { role, permissions: ALL_PERMISSIONS };
    }

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
    this.assertConfigurable(role);
    const permissions = data.permissions;
    return this.prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });
  }

  /** Remet un rôle sur ses permissions d'usine. */
  resetRolePermissions(role: StaffRole) {
    this.assertConfigurable(role);
    const permissions = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
    return this.prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    });
  }

  /**
   * Un compte racine privé d'une permission, c'est un logiciel dont plus
   * personne ne peut rendre la main. Le refus est ici, en un seul endroit,
   * plutôt que réparti sur chaque appelant.
   */
  private assertConfigurable(role: string) {
    if (isSuperAdmin(role)) {
      throw new ForbiddenException(
        'Les permissions du super administrateur ne sont pas modifiables.',
      );
    }
  }

  // ─── Dérogations individuelles ────────────────────────────────────────────

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    if (!user) throw new NotFoundException("Membre d'équipe introuvable");

    // Aucune dérogation ne s'applique au compte racine : ses droits sont
    // entiers par construction.
    if (isSuperAdmin(user.role)) {
      return {
        user,
        rolePermissions: ALL_PERMISSIONS,
        overrides: [],
        effective: ALL_PERMISSIONS,
      };
    }

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
    this.assertConfigurable(user.role);

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
