import api from '@/lib/api-client';

export interface UploadResult {
  url: string;
  pathname: string;
}

export const mediaService = {
  uploadMenuItemImage: async (menuItemId: string, file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/media/upload/menu-item/${menuItemId}`, formData) as Promise<UploadResult>;
  },

  uploadCategoryImage: async (categoryId: string, file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/media/upload/category/${categoryId}`, formData) as Promise<UploadResult>;
  },

  deleteMenuItemImage: async (menuItemId: string): Promise<void> => {
    await api.delete(`/media/menu-item/${menuItemId}/image`);
  },

  deleteCategoryImage: async (categoryId: string): Promise<void> => {
    await api.delete(`/media/category/${categoryId}/image`);
  },

  uploadRestaurantLogo: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload/restaurant-logo', formData) as Promise<UploadResult>;
  },

  deleteRestaurantLogo: async (): Promise<void> => {
    await api.delete('/media/restaurant-logo');
  },

  uploadRestaurantBanner: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload/restaurant-banner', formData) as Promise<UploadResult>;
  },

  deleteRestaurantBanner: async (): Promise<void> => {
    await api.delete('/media/restaurant-banner');
  },
};
