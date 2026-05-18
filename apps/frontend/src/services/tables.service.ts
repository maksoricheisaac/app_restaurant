import api from '@/lib/api-client';

export const tablesService = {
  getTables: async (params?: any) => {
    return api.get('/tables', { params });
  },

  getTableLocations: async () => {
    return api.get('/tables/locations');
  },

  createTable: async (tableData: any) => {
    return api.post('/tables', tableData);
  },

  updateTable: async (id: string, tableData: any) => {
    return api.patch(`/tables/${id}`, tableData);
  },

  deleteTable: async (id: string) => {
    return api.delete(`/tables/${id}`);
  },
};
