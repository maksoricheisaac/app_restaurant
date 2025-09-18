import { useEffect, useRef, useCallback } from 'react';
import { Channel } from 'pusher-js';
import { pusherClient } from '@/lib/pusherClient';

interface UsePusherOptions {
  channel: string;
  events: string[];
  onEvent: (event: string, data: unknown) => void;
}

export const usePusher = ({ channel, events, onEvent }: UsePusherOptions) => {
  const channelRef = useRef<Channel | null>(null);
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
      pusherChannel.bind(event, (data: unknown) => {
        memoizedOnEvent(event, data);
      });
    });

    channelRef.current = pusherChannel;

    // Nettoyage lors du démontage
    return () => {
      const currentChannel = channelRef.current;
      if (currentChannel) {
        events.forEach(event => {
          currentChannel.unbind(event);
        });
        pusherClient.unsubscribe(channel);
        isSubscribedRef.current = false;
      }
    };
  }, [channel, events, memoizedOnEvent]);

  return channelRef.current;
}; 