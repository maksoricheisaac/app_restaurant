'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

export const SocketProvider = ({ 
  children, 
  tenantId,
  orderId 
}: { 
  children: ReactNode; 
  tenantId?: string;
  orderId?: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001/ws', {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Socket.IO connected');

      // Rejoindre les rooms appropriées
      if (tenantId) {
        socketInstance.emit('join-tenant', { tenantId });
      }
      if (orderId) {
        socketInstance.emit('join-order', { orderId });
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Socket.IO disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [tenantId, orderId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
