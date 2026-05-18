import { permissionsService } from "@/services/permissions.service";
import { Permission, ROLE_PERMISSIONS, UserRole } from "@/types/permissions";

type PermissionOverride = { permission: Permission; granted: boolean };

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  customPermissions?: PermissionOverride[];
}

export async function getAllUsersWithPermissions(): Promise<StaffUser[]> {
  const payload = await permissionsService.getPersonnel();
  if (Array.isArray(payload)) {
    return payload as StaffUser[];
  }
  if (Array.isArray((payload as any)?.data)) {
    return (payload as any).data as StaffUser[];
  }
  return [];
}

export async function getUserPermissions(userId: string): Promise<{
  rolePermissions: Permission[];
  customPermissions: PermissionOverride[];
}> {
  const users = await getAllUsersWithPermissions();
  const user = users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  return {
    rolePermissions: ROLE_PERMISSIONS[user.role] || [],
    customPermissions: user.customPermissions || [],
  };
}

export async function updateUserPermissions(
  userId: string,
  permissions: PermissionOverride[],
): Promise<unknown> {
  return permissionsService.updateStaff(userId, {
    customPermissions: permissions,
  });
}
