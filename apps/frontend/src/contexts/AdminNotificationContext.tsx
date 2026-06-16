'use client';

import { createContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { toast } from 'sonner';

const AdminNotificationContext = createContext<null>(null);

export function AdminNotificationProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  // Invalide les caches React Query en temps réel (liste commandes, KDS, etc.)
  useRealtimeInvalidation();

  const handleNewOrder = useCallback((_data: unknown) => {
    toast.info('Nouvelle commande reçue !');
    audioRef.current?.play().catch(() => {
      // Autoplay bloqué par le navigateur — silence silencieux
    });
  }, []);

  const handleStatusUpdate = useCallback((data: { id: string; status: string }) => {
    toast.success(`Commande mise à jour : "${data.status}"`);
  }, []);

  useSocketEvent('new-order', handleNewOrder);
  useSocketEvent('order-status-updated', handleStatusUpdate);

  return (
    <AdminNotificationContext.Provider value={null}>
      {children}
    </AdminNotificationContext.Provider>
  );
}
