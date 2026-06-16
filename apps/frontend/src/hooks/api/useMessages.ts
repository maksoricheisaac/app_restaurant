import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesService } from "@/services/messages.service";

export const useMessages = (params?: { period?: string; date?: string; status?: string }) => {
  return useQuery({
    queryKey: ["messages", params],
    queryFn: () => messagesService.getMessages(params),
  });
};

export const useMessage = (id: string) => {
  return useQuery({
    queryKey: ["message", id],
    queryFn: () => messagesService.getMessageById(id),
    enabled: !!id,
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      messagesService.updateMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => messagesService.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};
