import api from '@/lib/api-client';

export const menuService = {
  getItems: async (params?: any) => {
    return api.get('/menu', { params });
  },

  getItemById: async (id: string) => {
    return api.get(`/menu/${id}`);
  },

  createItem: async (itemData: any) => {
    return api.post('/menu', itemData);
  },

  updateItem: async (id: string, itemData: any) => {
    return api.patch(`/menu/${id}`, itemData);
  },

  deleteItem: async (id: string) => {
    return api.delete(`/menu/${id}`);
  },

  getCategories: async (params?: any) => {
    return api.get('/categories', { params });
  },

  createCategory: async (categoryData: any) => {
    return api.post('/categories', categoryData);
  },

  updateCategory: async (id: string, categoryData: any) => {
    return api.patch(`/categories/${id}`, categoryData);
  },

  deleteCategory: async (id: string) => {
    return api.delete(`/categories/${id}`);
  },

  // ── Options / suppléments de plats ────────────────────────────────────────
  getItemOptions: async (menuItemId: string) => {
    return api.get(`/menu-options/item/${menuItemId}`);
  },

  createOptionGroup: async (data: any) => {
    return api.post('/menu-options/groups', data);
  },

  updateOptionGroup: async (id: string, data: any) => {
    return api.patch(`/menu-options/groups/${id}`, data);
  },

  deleteOptionGroup: async (id: string) => {
    return api.delete(`/menu-options/groups/${id}`);
  },

  createOption: async (data: any) => {
    return api.post('/menu-options/options', data);
  },

  updateOption: async (id: string, data: any) => {
    return api.patch(`/menu-options/options/${id}`, data);
  },

  deleteOption: async (id: string) => {
    return api.delete(`/menu-options/options/${id}`);
  },
};
