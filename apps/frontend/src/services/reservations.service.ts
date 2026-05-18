import api from '@/lib/api-client';

export const reservationsService = {
  getReservations: async (filters?: any) => {
    return api.get('/reservations', { params: filters });
  },

  createReservation: async (reservationData: any) => {
    return api.post('/reservations', reservationData);
  },

  updateStatus: async (id: string, status: string) => {
    return api.patch(`/reservations/${id}/status`, { status });
  },

  deleteReservation: async (id: string) => {
    return api.delete(`/reservations/${id}`);
  },
};
