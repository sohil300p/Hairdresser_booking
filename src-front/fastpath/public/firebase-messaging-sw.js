// Scripts for firebase messaging background handling
importScripts('./firebase-app-compat.js');
importScripts('./firebase-messaging-compat.js');

// Firebase configuration - must match the config in firebase.ts
// For service workers, we can't use import.meta.env, so use the same values
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "reservator-application.firebaseapp.com",
  projectId: "reservator-application",
  storageBucket: "reservator-application.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Only initialize if not using placeholder values
if (firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
  firebase.initializeApp(firebaseConfig);
  
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/images/icon-192.png',
      badge: '/images/icon-192.png',
      data: payload.data || {},
      tag: payload.data?.tag || 'default',
      requireInteraction: false
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification clicked', event);
    event.notification.close();
    
    // You can add navigation logic here
    if (event.notification.data && event.notification.data.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    }
  });
} else {
  console.warn('[firebase-messaging-sw.js] Firebase not configured - update firebaseConfig');
}

