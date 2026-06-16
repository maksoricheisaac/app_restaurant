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

  uploadTenantLogo: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload/tenant-logo', formData) as Promise<UploadResult>;
  },

  deleteTenantLogo: async (): Promise<void> => {
    await api.delete('/media/tenant-logo');
  },

  uploadTenantBanner: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload/tenant-banner', formData) as Promise<UploadResult>;
  },

  deleteTenantBanner: async (): Promise<void> => {
    await api.delete('/media/tenant-banner');
  },
};
