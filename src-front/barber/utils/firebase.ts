import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { api } from './api';

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' // Optional but recommended
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Register token with backend
        // Note: Barber app api might handle tokens differently, ensuring we send this as an authenticated barber
        await api.post('/notifications/register-token', {
          fcmToken: currentToken,
          platform: 'web'
        });
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("payload", payload);
      resolve(payload);
    });
  });

export default app;

