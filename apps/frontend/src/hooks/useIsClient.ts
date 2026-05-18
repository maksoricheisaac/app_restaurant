"use client"

import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si on est côté client, évitant les problèmes d'hydratation
 * Retourne false pendant la phase d'hydratation, puis true côté client
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook pour détecter la taille d'écran côté client uniquement
 * Évite les problèmes d'hydratation avec window.matchMedia
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  // Retourne false pendant l'hydratation pour éviter les mismatches
  return mounted ? matches : false;
} 