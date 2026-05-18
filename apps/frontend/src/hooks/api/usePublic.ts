import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicService } from "@/services/public.service";

export const useCreatePublicOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => publicService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-menu"] });
    },
  });
};

export const usePublicMenu = (params?: any) => {
  return useQuery({
    queryKey: ["public-menu", params],
    queryFn: () => publicService.getMenu(params),
  });
};

export const usePublicCategories = () => {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: () => publicService.getCategories(),
  });
};
