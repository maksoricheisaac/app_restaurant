import api from '@/lib/api-client';

export const inventoryService = {
  getIngredients: async () => {
    return api.get('/inventory/ingredients');
  },

  createIngredient: async (ingredientData: any) => {
    return api.post('/inventory/ingredients', ingredientData);
  },

  addMovement: async (movementData: any) => {
    return api.post('/inventory/movements', movementData);
  },

  getMovements: async (params?: any) => {
    return api.get('/inventory/movements', { params });
  },

  getLowStockAlerts: async () => {
    return api.get('/inventory/low-stock');
  },

  getRecipes: async () => {
    return api.get('/inventory/recipes');
  },

  createRecipe: async (recipeData: any) => {
    return api.post('/inventory/recipes', recipeData);
  },

  updateRecipe: async (id: string, recipeData: any) => {
    return api.patch(`/inventory/recipes/${id}`, recipeData);
  },

  deleteRecipe: async (id: string) => {
    return api.delete(`/inventory/recipes/${id}`);
  },

  getDashboard: async () => {
    return api.get('/inventory/dashboard');
  },
};
