import api from '@/lib/api-client';

export const settingsService = {
  getSettings: async () => {
    return api.get('/settings');
  },

  updateSettings: async (data: any) => {
    return api.patch('/settings', data);
  },

  getDeliveryZones: async () => {
    return api.get('/settings/delivery-zones');
  },

  createDeliveryZone: async (data: any) => {
    return api.post('/settings/delivery-zones', data);
  },

  updateDeliveryZone: async (id: string, data: any) => {
    return api.patch(`/settings/delivery-zones/${id}`, data);
  },

  deleteDeliveryZone: async (id: string) => {
    return api.delete(`/settings/delivery-zones/${id}`);
  },

  getOpeningHours: async () => {
    return api.get('/settings/opening-hours');
  },

  updateOpeningHours: async (data: any) => {
    return api.patch('/settings/opening-hours', data);
  },

  getSocialLinks: async () => {
    return api.get('/settings/social-links');
  },

  updateSocialLinks: async (data: any) => {
    return api.patch('/settings/social-links', data);
  },

  getLimits: async () => {
    return api.get('/settings/limits');
  },

  updateLimits: async (data: any) => {
    return api.patch('/settings/limits', data);
  },
};
