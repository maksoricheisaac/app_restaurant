"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 0 = data toujours considérée stale → refetch garanti à chaque
            // mount ET après chaque invalidateQueries, quel que soit le timing.
            // Comportement attendu pour un panel admin où la fraîcheur prime.
            staleTime: 0,
            gcTime: 1000 * 60 * 5, // conserve le cache 5 min (navigation rapide)
            retry: 1,
            refetchOnWindowFocus: true,   // actualisation au retour sur l'onglet
            refetchOnReconnect: true,     // actualisation après perte réseau
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
