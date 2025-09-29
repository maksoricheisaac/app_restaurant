import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMenuItem, updateMenuItem, deleteMenuItem } from '@/actions/admin/menu-actions';

export const useCreateDish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateDish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMenuItem,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteDish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
