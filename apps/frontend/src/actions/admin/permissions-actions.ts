import { permissionsService } from "@/services/permissions.service";
import { staffService } from "@/services/staff.service";
import { Permission, UserRole } from "@/types/permissions";

type PermissionOverride = { permission: Permission; granted: boolean };

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
}

export async function getAllUsersWithPermissions(): Promise<StaffUser[]> {
  const payload = await staffService.list();
  if (Array.isArray(payload)) {
    return payload as StaffUser[];
  }
  if (Array.isArray((payload as any)?.data)) {
    return (payload as any).data as StaffUser[];
  }
  return [];
}

/**
 * Permissions effectives d'un membre : celles de son rôle, plus les
 * dérogations individuelles. Le calcul est fait par le serveur — le client ne
 * rejoue plus la matrice de son côté, ce qui entretenait deux sources de
 * vérité susceptibles de diverger.
 */
export async function getUserPermissions(userId: string): Promise<{
  rolePermissions: Permission[];
  customPermissions: PermissionOverride[];
  effective: Permission[];
}> {
  const result = (await permissionsService.getUserPermissions(userId)) as {
    rolePermissions?: Permission[];
    overrides?: PermissionOverride[];
    effective?: Permission[];
  };

  return {
    rolePermissions: result.rolePermissions ?? [],
    customPermissions: result.overrides ?? [],
    effective: result.effective ?? [],
  };
}

export async function updateUserPermissions(
  userId: string,
  permissions: PermissionOverride[],
): Promise<unknown> {
  // L'API expose un upsert par permission : chaque dérogation est posée
  // individuellement, ce qui rend l'opération idempotente et traçable.
  return Promise.all(
    permissions.map((p) =>
      permissionsService.setUserPermission(userId, {
        permission: p.permission,
        granted: p.granted,
      }),
    ),
  );
}
