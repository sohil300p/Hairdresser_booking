import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { api } from './api';

// Firebase configuration - Get from Firebase Console -> Project Settings -> General -> Your apps
// For localhost, you can use environment variables or hardcode for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reservator-application.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reservator-application",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reservator-application.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_PUBLIC_VAPID_KEY_HERE';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
         VAPID_KEY !== 'YOUR_PUBLIC_VAPID_KEY_HERE';
};

// Initialize Firebase
try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase initialized');
  } else {
    console.warn('⚠️ Firebase not configured. Push notifications will not work.');
    console.warn('Please set VITE_FIREBASE_* environment variables or update firebase.ts');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Register service worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('⚠️ Service Workers are not supported in this browser');
    return null;
  }
};

export const requestForToken = async () => {
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase not configured. Cannot request notification token.');
    return null;
  }

  if (!messaging) {
    console.error('❌ Firebase messaging not initialized');
    return null;
  }

  try {
    // Register service worker first
    await registerServiceWorker();

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);

    if (permission === 'granted') {
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY
        });

        if (currentToken) {
          console.log('✅ FCM Token obtained:', currentToken.substring(0, 20) + '...');
          
          // Register token with backend
          try {
            await api.post('/notifications/register-token', {
              fcmToken: currentToken,
              platform: 'web'
            });
            console.log('✅ Token registered with backend');
          } catch (apiError) {
            console.error('❌ Failed to register token with backend:', apiError);
          }
          
          return currentToken;
        } else {
          console.warn('⚠️ No registration token available. Request permission to generate one.');
          return null;
        }
      } catch (tokenError: any) {
        console.error('❌ Error getting FCM token:', tokenError);
        if (tokenError.code === 'messaging/unsupported-browser') {
          console.error('Browser does not support Firebase Cloud Messaging');
        }
        return null;
      }
    } else {
      console.log('⚠️ Notification permission denied:', permission);
      return null;
    }
  } catch (err: any) {
    console.error('❌ Error requesting notification token:', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error('Firebase messaging not initialized'));
      return;
    }
    
    try {
      onMessage(messaging, (payload) => {
        console.log("📨 Received foreground message:", payload);
        resolve(payload);
      });
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
      reject(error);
    }
  });

export default app;

