import { useEffect, useRef, useCallback } from 'react';
import { pusherClient } from '@/lib/pusherClient';

interface UsePusherOptions {
  channel: string;
  events: string[];
  onEvent: (event: string, data: any) => void;
}

export const usePusher = ({ channel, events, onEvent }: UsePusherOptions) => {
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Memoize the callback to prevent unnecessary re-subscriptions
  const memoizedOnEvent = useCallback(onEvent, [onEvent]);

  useEffect(() => {
    // Éviter les souscriptions multiples
    if (isSubscribedRef.current) {
      return;
    }

    // Se connecter au canal Pusher
    const pusherChannel = pusherClient.subscribe(channel);
    isSubscribedRef.current = true;

    // Écouter les événements spécifiés
    events.forEach(event => {
      pusherChannel.bind(event, (data: any) => {
        memoizedOnEvent(event, data);
      });
    });

    channelRef.current = pusherChannel;

    // Nettoyage lors du démontage
    return () => {
      if (channelRef.current) {
        events.forEach(event => {
          channelRef.current.unbind(event);
        });
        pusherClient.unsubscribe(channel);
        isSubscribedRef.current = false;
      }
    };
  }, [channel, events, memoizedOnEvent]);

  return channelRef.current;
}; 