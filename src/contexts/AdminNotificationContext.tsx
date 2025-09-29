'use client';

import { createContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { usePusher } from '@/hooks/usePusher';
import { toast } from 'sonner';

// Ce contexte n'a pas besoin d'exposer de valeur, son but est d'exécuter un effet de bord (Pusher)
const AdminNotificationContext = createContext<null>(null);

export function AdminNotificationProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialiser l'audio côté client uniquement
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const handlePusherEvent = useCallback((event: string, data: unknown) => {
    console.log(`Admin Pusher event: ${event}`, data);

    if (event === 'new-order') {
      toast.info('Nouvelle commande reçue !');
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.error('Erreur lors de la lecture du son:', error);
          toast.warning('Le son de notification n\'a pas pu être joué. Veuillez interagir avec la page.');
        });
      }
    } else if (event === 'order-status-updated') {
      // Type guard pour s'assurer que data a la bonne structure
      if (typeof data === 'object' && data !== null && 'orderId' in data && 'status' in data) {
        const { orderId, status } = data as { orderId: string; status: string };
        toast.success(`Le statut de la commande #${orderId} a été mis à jour à "${status}".`);
      } else {
        console.warn('Données de mise à jour de statut de commande invalides:', data);
      }
    }
  }, []);

  usePusher({
    channel: 'restaurant-channel',
    events: ['new-order', 'order-status-updated'],
    onEvent: handlePusherEvent,
  });

  return (
    <AdminNotificationContext.Provider value={null}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

// Ce hook n'est plus nécessaire car le contexte ne fournit aucune valeur.
// Si vous avez besoin d'exposer des fonctions ou des états à l'avenir,
// vous pourrez le réactiver.
// export function useAdminNotification() {
//   const context = useContext(AdminNotificationContext);
//   if (context === undefined) {
//     throw new Error('useAdminNotification must be used within an AdminNotificationProvider');
//   }
//   return context;
// }
