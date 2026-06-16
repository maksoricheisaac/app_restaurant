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
 * SocketProvider — gestion stable de la connexion Socket.io.
 *
 * Design choices:
 * - Une seule instance Socket créée au montage (pas de reconnexion à chaque changement de tenantId).
 * - Quand tenantId/orderId changent APRÈS connexion, on émet join-* immédiatement
 *   sans recréer le socket (pas de reconnect storm).
 * - Les refs capturent les valeurs courantes pour éviter les stale closures dans
 *   le handler connect (qui ne connaît que les valeurs au moment de sa création).
 * - Sur démontage : disconnect propre + reset état.
 */
export const SocketProvider = ({
  children,
  tenantId,
  orderId,
}: {
  children: ReactNode;
  tenantId?: string;
  orderId?: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Refs pour accéder aux valeurs courantes depuis le handler connect (closure stable)
  const tenantIdRef = useRef(tenantId);
  const orderIdRef = useRef(orderId);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { tenantIdRef.current = tenantId; }, [tenantId]);
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
      // Re-join rooms à chaque (re)connexion — couvre le cas expiration JWT + auto-reconnect
      if (tenantIdRef.current) {
        s.emit('join-tenant', { tenantId: tenantIdRef.current });
      }
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

  // Re-join la room tenant quand tenantId devient disponible ou change
  useEffect(() => {
    const s = socketRef.current;
    if (!s?.connected || !tenantId) return;
    s.emit('join-tenant', { tenantId });
  }, [tenantId]);

  // Re-join la room order quand orderId change
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
