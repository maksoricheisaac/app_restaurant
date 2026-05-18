import { useQuery } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';

export const useMenuItems = (params?: any) => {
  return useQuery({
    queryKey: ['menu-items', params],
    queryFn: () => menuService.getItems(params),
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
