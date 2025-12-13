import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let isInitialized = false;

export const initializeFirebase = () => {
  if (isInitialized) return admin;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isInitialized = true;
      console.log('✅ Firebase Admin Initialized');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in env. Push notifications will not work.');
    }
  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error);
  }

  return admin;
};

export const getMessaging = () => {
  if (!isInitialized) initializeFirebase();
  return isInitialized ? admin.messaging() : null;
};

