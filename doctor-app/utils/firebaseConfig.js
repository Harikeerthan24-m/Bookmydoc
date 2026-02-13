import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_FIREBASE_API_KEY,
  APP_FIREBASE_AUTH_DOMAIN,
  APP_FIREBASE_PROJECT_ID,
  APP_FIREBASE_STORAGE_BUCKET,
  APP_FIREBASE_MESSAGING_SENDER_ID,
  APP_FIREBASE_APP_ID,
  APP_FIREBASE_MEASUREMENT_ID,
} from '@env';
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  sendEmailVerification,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: APP_FIREBASE_API_KEY,
  authDomain: APP_FIREBASE_AUTH_DOMAIN,
  projectId: APP_FIREBASE_PROJECT_ID,
  storageBucket: APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: APP_FIREBASE_APP_ID,
  measurementId: APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export {
  auth,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
};
