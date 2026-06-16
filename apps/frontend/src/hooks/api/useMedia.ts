'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/services/media.service';

export const useUploadMenuItemImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuItemId, file }: { menuItemId: string; file: File }) =>
      mediaService.uploadMenuItemImage(menuItemId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-item', variables.menuItemId] });
    },
  });
};

export const useUploadCategoryImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, file }: { categoryId: string; file: File }) =>
      mediaService.uploadCategoryImage(categoryId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    },
  });
};

export const useDeleteMenuItemImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menuItemId: string) => mediaService.deleteMenuItemImage(menuItemId),
    onSuccess: (_, menuItemId) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-item', menuItemId] });
    },
  });
};

export const useDeleteCategoryImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => mediaService.deleteCategoryImage(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    },
  });
};

export const useUploadTenantLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaService.uploadTenantLogo(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-me'] }),
  });
};

export const useDeleteTenantLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mediaService.deleteTenantLogo(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-me'] }),
  });
};

export const useUploadTenantBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaService.uploadTenantBanner(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-me'] }),
  });
};

export const useDeleteTenantBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mediaService.deleteTenantBanner(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-me'] }),
  });
};
