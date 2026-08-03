'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider — connexion Socket.io stable.
 *
 * Le personnel authentifié rejoint le salon de l'établissement côté serveur,
 * dès la poignée de main : il n'y a plus rien à émettre pour cela. Seul le
 * suivi public d'une commande demande encore un `join-order` explicite,
 * puisque le client anonyme désigne une commande précise.
 *
 * - Socket créé une seule fois au montage (pas de tempête de reconnexions).
 * - Les refs évitent les fermetures périmées dans le handler `connect`.
 * - Démontage : déconnexion propre et remise à zéro de l'état.
 */
export const SocketProvider = ({
  children,
  orderId,
}: {
  children: ReactNode;
  orderId?: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Refs pour lire les valeurs courantes depuis le handler connect
  const orderIdRef = useRef(orderId);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { orderIdRef.current = orderId; }, [orderId]);

  // Création unique du socket au montage du Provider
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000/ws';

    const s = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket'],
      // Reconnexion avec backoff exponentiel pour éviter les storms sous réseau instable
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
    });

    socketRef.current = s;
    setSocket(s);

    const onConnect = () => {
      setConnected(true);
      // Re-join à chaque (re)connexion — couvre l'expiration du JWT suivie
      // d'une reconnexion automatique.
      if (orderIdRef.current) {
        s.emit('join-order', { orderId: orderIdRef.current });
      }
    };

    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // Si le socket était déjà connecté (HMR en dev)
    if (s.connected) onConnect();

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, []); // Socket créé une seule fois par montage

  // Re-join le salon de suivi quand orderId change
  useEffect(() => {
    const s = socketRef.current;
    if (!s?.connected || !orderId) return;
    s.emit('join-order', { orderId });
  }, [orderId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
