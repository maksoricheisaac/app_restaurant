import api from '@/lib/api-client';

/** Gestion de l'équipe (réservée owner/manager). */
export const staffService = {
  list: async () => api.get('/staff'),
  create: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  }) => api.post('/staff', data),
  update: async (id: string, data: Record<string, unknown>) =>
    api.patch(`/staff/${id}`, data),
  remove: async (id: string) => api.delete(`/staff/${id}`),
  transferOwnership: async (userId: string) =>
    api.patch('/staff/transfer-ownership', { userId }),

  inviteByEmail: async (data: { email: string; role: string }) =>
    api.post('/staff/invites', data),
  listInvites: async () => api.get('/staff/invites'),
  revokeInvite: async (id: string) => api.delete(`/staff/invites/${id}`),
  resendInvite: async (id: string) => api.post(`/staff/invites/${id}/resend`),
};

/**
 * Routes publiques d'invitation. Accepter une invitation crée le compte : il
 * n'existe plus d'inscription libre, seulement des personnes invitées par
 * l'équipe en place.
 */
export const invitesService = {
  getPreview: async (token: string) => api.get(`/invites/${token}`),
  accept: async (token: string, data: { name: string; password: string }) =>
    api.post(`/invites/${token}/accept`, data),
  decline: async (token: string) => api.post(`/invites/${token}/decline`),
};
