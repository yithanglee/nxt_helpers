// lib/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { postData } from './svt_utils';
import Cookies from 'js-cookie';
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL, PHX_COOKIE } from '@/lib/constants';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let messaging:any = null;

// Initialize messaging only on the client side and after service worker registration
if (typeof window !== 'undefined') {
  // Initialize messaging after making sure service worker is registered
  const initializeMessaging = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        
        messaging = getMessaging(app);
        console.log('Firebase messaging initialized with service worker:', registration);
      }
    } catch (error) {
      console.error('Failed to initialize Firebase messaging:', error);
    }
  };

  initializeMessaging();
}

async function requestNotificationPermission() {
  try {
    if (!messaging) {
      throw new Error('Messaging not initialized');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Make sure we have a service worker registration
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration
      });

      if (currentToken) {
        await saveTokenToServer(currentToken);
        return currentToken;
      }
    }

    throw new Error('No registration token available');
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    throw error;
  }
}

function onMessageListener() {
  if (!messaging) return;

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}

async function saveTokenToServer(token: string) {
  try {
    console.log("Checking existing user...");
    const storedCookie = Cookies.get(PHX_COOKIE);

    if (storedCookie) {
      const response = await fetch(
        `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}/svt_api/webhook?scope=get_cookie_user&cookie=${storedCookie}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const storedUser = await response.json();

      if (storedUser) {
        let url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`;
        await postData({
          endpoint: `${url}/svt_api/webhook`,
          data: { 
            token: token, 
            user_token: storedUser.cookie, 
            scope: 'user_fcm_token' 
          }
        });
        console.log('FCM token saved successfully');
      }
    }
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
}

export { auth, requestNotificationPermission, onMessageListener };