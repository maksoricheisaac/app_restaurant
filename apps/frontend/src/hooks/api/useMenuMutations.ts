'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';

// ── Menu items ────────────────────────────────────────────────────────────────

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => menuService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      // Les stats du menu (available count, etc.) peuvent changer
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => menuService.updateItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-item', variables.id] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
      // Suppression d'un item peut désactiver une catégorie (plus d'items visibles)
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    },
  });
};

// ── Catégories ────────────────────────────────────────────────────────────────

export const useCreateMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => menuService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    },
  });
};

export const useUpdateMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => menuService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      // Les items qui référencent la catégorie doivent être rechargés
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
};

export const useDeleteMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      // Les items orphelins (si cascade) disparaissent aussi
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });
};
