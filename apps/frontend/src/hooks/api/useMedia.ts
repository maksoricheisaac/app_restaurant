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

export const useUploadRestaurantLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaService.uploadRestaurantLogo(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant'] }),
  });
};

export const useDeleteRestaurantLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mediaService.deleteRestaurantLogo(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant'] }),
  });
};

export const useUploadRestaurantBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaService.uploadRestaurantBanner(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant'] }),
  });
};

export const useDeleteRestaurantBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mediaService.deleteRestaurantBanner(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant'] }),
  });
};
