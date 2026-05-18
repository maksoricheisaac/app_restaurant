import api from '@/lib/api-client';

export const tenantsService = {
  getTenants: async () => {
    return api.get('/tenants');
  },

  getTenantById: async (id: string) => {
    return api.get(`/tenants/${id}`);
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
