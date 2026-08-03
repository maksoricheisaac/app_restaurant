'use client';

import { ReactNode } from 'react';
import { SocketProvider } from '@/components/providers/SocketProvider';

/**
 * Frontière client qui fournit le contexte Socket.io à l'arbre
 * d'administration. Vit hors du Server Component pour que SocketProvider
 * (qui utilise useEffect) puisse être monté correctement.
 */
export function AdminSocketWrapper({ children }: { children: ReactNode }) {
  return <SocketProvider>{children}</SocketProvider>;
}
