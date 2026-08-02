'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';

export interface MenuOption {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number | string;
  available: boolean;
  sortOrder: number;
}

export interface MenuOptionGroup {
  id: string;
  menuItemId: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: MenuOption[];
}

const key = (menuItemId: string) => ['menu-item-options', menuItemId];

export const useItemOptions = (menuItemId?: string) =>
  useQuery<MenuOptionGroup[]>({
    queryKey: key(menuItemId ?? ''),
    queryFn: () => menuService.getItemOptions(menuItemId as string),
    enabled: !!menuItemId,
  });

/** Regroupe toutes les mutations d'options pour un plat donné + invalidation. */
export function useOptionMutations(menuItemId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key(menuItemId) });
    qc.invalidateQueries({ queryKey: ['menu-items'] });
  };

  return {
    createGroup: useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        menuService.createOptionGroup({ ...data, menuItemId }),
      onSuccess: invalidate,
    }),
    updateGroup: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
        menuService.updateOptionGroup(id, data),
      onSuccess: invalidate,
    }),
    deleteGroup: useMutation({
      mutationFn: (id: string) => menuService.deleteOptionGroup(id),
      onSuccess: invalidate,
    }),
    createOption: useMutation({
      mutationFn: (data: Record<string, unknown>) => menuService.createOption(data),
      onSuccess: invalidate,
    }),
    updateOption: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
        menuService.updateOption(id, data),
      onSuccess: invalidate,
    }),
    deleteOption: useMutation({
      mutationFn: (id: string) => menuService.deleteOption(id),
      onSuccess: invalidate,
    }),
  };
}
