import api from '@/lib/api-client';

export const messagesService = {
  getMessages: async (params?: { period?: string; date?: string }) => {
    return api.get('/messages', { params });
  },

  getMessageById: async (id: string) => {
    return api.get(`/messages/${id}`);
  },

  updateMessage: async (id: string, messageData: any) => {
    return api.patch(`/messages/${id}`, messageData);
  },

  deleteMessage: async (id: string) => {
    return api.delete(`/messages/${id}`);
  },
};
