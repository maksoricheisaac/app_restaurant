import api from '@/lib/api-client';

export const permissionsService = {
  getPersonnel: async () => {
    return api.get('/permissions/personnel');
  },

  createStaff: async (data: any) => {
    return api.post('/permissions/staff', data);
  },

  updateStaff: async (id: string, data: any) => {
    return api.patch(`/permissions/staff/${id}`, data);
  },

  deleteStaff: async (id: string) => {
    return api.delete(`/permissions/staff/${id}`);
  },

  getRolePermissions: async (role: string) => {
    return api.get(`/permissions/roles/${role}`);
  },

  updateRolePermissions: async (role: string, permissions: string[]) => {
    return api.patch(`/permissions/roles/${role}`, { permissions });
  },
};
