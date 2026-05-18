import api from '@/lib/api-client';

export const contactService = {
  sendMessage: async (data: any) => {
    return api.post('/messages', data);
  },
};
