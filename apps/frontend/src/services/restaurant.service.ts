import api from '@/lib/api-client';

/**
 * Configuration de l'unique établissement. Remplace l'ancien
 * `settings.service` (paramètres du tenant) et `tenants.service` (identité du
 * tenant), qui décrivaient deux facettes de la même chose.
 */
export const restaurantService = {
  get: async () => api.get('/restaurant'),
  getPublicProfile: async () => api.get('/restaurant/public'),

  updateIdentity: async (data: any) => api.patch('/restaurant', data),
  updateService: async (data: any) => api.patch('/restaurant/service', data),
  updateCash: async (data: any) => api.patch('/restaurant/cash', data),
  updatePrinting: async (data: any) => api.patch('/restaurant/printing', data),
  updateSocialLinks: async (data: any) =>
    api.patch('/restaurant/social-links', data),

  getOpeningHours: async () => api.get('/restaurant/opening-hours'),
  updateOpeningHours: async (data: any) =>
    api.patch('/restaurant/opening-hours', data),

  getClosures: async () => api.get('/restaurant/closures'),
  createClosure: async (data: { date: string; reason?: string }) =>
    api.post('/restaurant/closures', data),
  deleteClosure: async (id: string) => api.delete(`/restaurant/closures/${id}`),

  getDeliveryZones: async () => api.get('/restaurant/delivery-zones'),
  createDeliveryZone: async (data: any) =>
    api.post('/restaurant/delivery-zones', data),
  updateDeliveryZone: async (id: string, data: any) =>
    api.patch(`/restaurant/delivery-zones/${id}`, data),
  deleteDeliveryZone: async (id: string) =>
    api.delete(`/restaurant/delivery-zones/${id}`),
};

export const setupService = {
  getStatus: async () => api.get('/setup/status'),
  complete: async (data: any) => api.post('/setup', data),
};
