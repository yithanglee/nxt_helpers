// hooks/useNotifications.ts
'use client';

import { useEffect, useState } from 'react';
import { onMessageListener } from '../lib/firebaseConfig';

type NotificationPayload = {
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
};

export function useNotifications() {
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const setupNotificationListener = async () => {
      try {
        setIsLoading(true);
        
        const messageListener = onMessageListener();
        if (messageListener) {
          messageListener.then((payload: any) => {
            setNotification(payload as NotificationPayload);
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to setup notification listener'));
      } finally {
        setIsLoading(false);
      }
    };

    setupNotificationListener();
  }, []);

  return { notification, isLoading, error };
}