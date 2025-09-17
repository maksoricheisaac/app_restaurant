import { useQuery } from '@tanstack/react-query';
import { getOrderHistory } from '@/actions/public/order-history-actions';
import { toast } from 'sonner';

export function useOrderHistory(email: string | null) {
  return useQuery({
    queryKey: ['orderHistory', email],
    queryFn: async () => {
      if (!email) return null;
      
      try {
  const result = await getOrderHistory({ userEmail: email });
        if (!result.data) {
          throw new Error(result.serverError || "Impossible de récupérer l'historique");
        }
        return result.data;
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Une erreur est survenue lors de la récupération de l'historique");
        }
        throw error;
      }
    },
    enabled: !!email,
    staleTime: 30000, // Considérer les données comme périmées après 30 secondes
  });
} 