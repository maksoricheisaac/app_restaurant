'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';

export const useSocketEvent = <T>(event: string, callback: (data: T) => void) => {
  const { socket, connected } = useSocket();

  // Memoize callback to prevent unnecessary re-subscriptions
  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (socket && connected) {
      socket.on(event, memoizedCallback);

      return () => {
        socket.off(event, memoizedCallback);
      };
    }
  }, [socket, connected, event, memoizedCallback]);
};
