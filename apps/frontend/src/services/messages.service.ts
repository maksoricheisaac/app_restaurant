import api from '@/lib/api-client';
import type { MessageStatus } from '@/types/message';

export const messagesService = {
  getMessages: async (params?: { period?: string; date?: string; status?: string }) => {
    return api.get('/messages', { params });
  },

  getMessageById: async (id: string) => {
    return api.get(`/messages/${id}`);
  },

  updateMessage: async (id: string, messageData: { status?: MessageStatus; read?: boolean; subject?: string }) => {
    return api.patch(`/messages/${id}`, messageData);
  },

  deleteMessage: async (id: string) => {
    return api.delete(`/messages/${id}`);
  },
};
