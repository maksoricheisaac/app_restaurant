import api from '@/lib/api-client';

export const tenantsService = {
  getTenants: async () => {
    return api.get('/tenants');
  },

  // Uses /tenants/me (TenantGuard) instead of /tenants/:id (super_admin only).
  // Requires x-tenant-id header, which api-client sets from localStorage automatically.
  getTenantById: async (_id: string) => {
    return api.get('/tenants/me');
  },

  resolveTenantBySlug: async (slug: string) => {
    return api.get(`/tenants/resolve/${slug}`);
  },

  createTenant: async (tenantData: any) => {
    return api.post('/tenants', tenantData);
  },

  updateTenant: async (id: string, tenantData: any) => {
    return api.patch(`/tenants/${id}`, tenantData);
  },
};
