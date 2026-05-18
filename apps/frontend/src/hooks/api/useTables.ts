import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tablesService } from "@/services/tables.service";

export const useTables = (params?: any) => {
  return useQuery({
    queryKey: ["tables", params],
    queryFn: () => tablesService.getTables(params),
  });
};

export const useTableLocations = () => {
  return useQuery({
    queryKey: ["table-locations"],
    queryFn: () => tablesService.getTableLocations(),
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tablesService.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-locations"] });
    },
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
      tablesService.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-locations"] });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tablesService.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-locations"] });
    },
  });
};
