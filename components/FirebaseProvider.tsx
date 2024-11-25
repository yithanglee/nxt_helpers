// components/FirebaseProvider.tsx
'use client';

import { useEffect } from 'react';
import { requestNotificationPermission } from '../lib/firebaseConfig';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered with scope:', registration.scope);
          
          await requestNotificationPermission();
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    initializeFirebase();
  }, []);

  return <>{children}</>;
}