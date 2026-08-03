import { useQuery } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';

export const useMenuItems = (params?: any) => {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: () => menuService.getItems(params),
  });
};

/** Carte du poste de caisse : tous les articles vendables, avec leurs options. */
export const usePosCatalogue = () => {
  return useQuery({
    queryKey: ['menu-pos-catalogue'],
    queryFn: () => menuService.getPosCatalogue(),
  });
};

export const useMenuCategories = (params?: any) => {
  return useQuery({
    queryKey: ['menu-categories', params],
    queryFn: () => menuService.getCategories(params),
  });
};

export const useMenuItem = (id: string) => {
  return useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => menuService.getItemById(id),
    enabled: !!id,
  });
};
