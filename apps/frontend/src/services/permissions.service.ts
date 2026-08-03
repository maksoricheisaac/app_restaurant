import api from '@/lib/api-client';

/**
 * Permissions de l'équipe. Le CRUD des membres vit désormais dans
 * `staff.service` — ce service ne traite plus que les droits.
 */
export const permissionsService = {
  getCatalog: async () => api.get('/permissions/catalog'),

  getAllRolePermissions: async () => api.get('/permissions/roles'),
  getRolePermissions: async (role: string) => api.get(`/permissions/roles/${role}`),
  updateRolePermissions: async (role: string, permissions: string[]) =>
    api.patch(`/permissions/roles/${role}`, { permissions }),
  resetRolePermissions: async (role: string) =>
    api.post(`/permissions/roles/${role}/reset`),

  getUserPermissions: async (userId: string) => api.get(`/permissions/users/${userId}`),
  setUserPermission: async (
    userId: string,
    data: { permission: string; granted: boolean },
  ) => api.patch(`/permissions/users/${userId}`, data),
  clearUserPermission: async (userId: string, permission: string) =>
    api.delete(`/permissions/users/${userId}/${permission}`),
};
