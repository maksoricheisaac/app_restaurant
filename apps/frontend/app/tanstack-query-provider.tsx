"use client";
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Filet de sécurité global : jusqu'ici, aucune des ~40 mutations de
        // src/hooks/api/* ne définissait onError, donc un échec réseau/
        // permission sur une action critique (statut de commande, caisse,
        // stock...) échouait silencieusement sans aucun retour utilisateur.
        // Une mutation peut toujours désactiver ce toast générique via
        // `meta: { skipGlobalErrorToast: true }` si elle gère déjà son
        // propre affichage d'erreur (ex: erreurs de champ de formulaire).
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.options.meta?.skipGlobalErrorToast) return;
            const message =
              error instanceof Error && error.message
                ? error.message
                : 'Une erreur est survenue. Veuillez réessayer.';
            toast.error(message);
          },
        }),
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
