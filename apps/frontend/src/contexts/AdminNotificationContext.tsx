'use client';

import { createContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { toast } from 'sonner';

// Ce contexte n'a pas besoin d'exposer de valeur, son but est d'exécuter un effet de bord (WebSockets)
const AdminNotificationContext = createContext<null>(null);

export function AdminNotificationProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialiser l'audio côté client uniquement
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const handleNewOrder = useCallback((data: any) => {
    console.log('Admin Socket event: new-order', data);
    toast.info('Nouvelle commande reçue !');
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Erreur lors de la lecture du son:', error);
        toast.warning('Le son de notification n\'a pas pu être joué.');
      });
    }
  }, []);

  const handleStatusUpdate = useCallback((data: { id: string; status: string }) => {
    console.log('Admin Socket event: order-status-updated', data);
    toast.success(`Le statut de la commande #${data.id} a été mis à jour à "${data.status}".`);
  }, []);

  useSocketEvent('new-order', handleNewOrder);
  useSocketEvent('order-status-updated', handleStatusUpdate);

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
