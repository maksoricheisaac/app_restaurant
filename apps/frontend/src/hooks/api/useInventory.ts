import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';

export const useIngredients = () => {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryService.getIngredients(),
  });
};

export const useInventoryDashboard = () => {
  return useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: () => inventoryService.getDashboard(),
  });
};

export const useStockMovements = (params?: any) => {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => inventoryService.getMovements(params),
  });
};

export const useLowStockAlerts = () => {
  return useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: () => inventoryService.getLowStockAlerts(),
  });
};

export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: () => inventoryService.getRecipes(),
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryService.createRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      inventoryService.updateRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};
