import api from '@/lib/api-client';

export const membershipsService = {
  inviteByEmail: async (data: { email: string; role: string }) => {
    return api.post('/memberships/invite', data);
  },

  listInvites: async () => {
    return api.get('/memberships/invites');
  },

  revokeInvite: async (id: string) => {
    return api.delete(`/memberships/invites/${id}`);
  },

  resendInvite: async (id: string) => {
    return api.post(`/memberships/invites/${id}/resend`);
  },
};

export const invitesService = {
  getPreview: async (token: string) => {
    return api.get(`/invites/${token}`);
  },

  accept: async (token: string) => {
    return api.post(`/invites/${token}/accept`);
  },

  decline: async (token: string) => {
    return api.post(`/invites/${token}/decline`);
  },
};
