'use client';

import { useEffect } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';

/**
 * Abonne un callback à un événement Socket.io.
 *
 * IMPORTANT : le callback doit être stable (wrappé dans useCallback par l'appelant)
 * pour éviter les ré-abonnements inutiles à chaque render.
 */
export const useSocketEvent = <T>(event: string, callback: (data: T) => void) => {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [socket, connected, event, callback]);
};
