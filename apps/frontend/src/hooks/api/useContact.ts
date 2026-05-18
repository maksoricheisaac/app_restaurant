import { useMutation } from "@tanstack/react-query";
import { contactService } from "@/services/contact.service";

export const useSendMessage = () => {
  return useMutation({
    mutationFn: (data: any) => contactService.sendMessage(data),
  });
};
