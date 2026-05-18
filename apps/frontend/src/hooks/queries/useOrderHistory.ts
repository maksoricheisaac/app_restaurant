import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";

type OrderHistoryParams =
  | { page?: number; limit?: number; status?: string }
  | string
  | null
  | undefined;

export function useOrderHistory(params?: OrderHistoryParams) {
  // Normalise: string = email filter (legacy usage), object = query params
  const queryParams =
    typeof params === "string" && params
      ? { search: params }
      : typeof params === "object" && params !== null
        ? params
        : undefined;

  return useQuery({
    queryKey: ["order-history", params],
    queryFn: async () => {
      const response = await api.get("/orders", { params: queryParams });
      return response.data ?? [];
    },
    enabled: params !== null, // don't fetch if explicitly null
  });
}
