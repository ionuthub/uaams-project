// lib/firebase.js
// Client-side Firebase initialisation for UAAMS.
// Values come from environment variables — never commit real keys (team brief, section 7).
// In Next.js, client-exposed vars must be prefixed NEXT_PUBLIC_.

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForUAAMSPrototypeTesting12345",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "uaams-demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "uaams-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "uaams-demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:demo1234567890",
};

function getFirebaseApp() {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("NEXT_PUBLIC_FIREBASE_* environment variables are missing. Using fallback demo configuration for prototype testing.");
  }

  // Avoid re-initialising during Next.js hot reload.
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

// Lazy getters keep Next.js static generation and Vercel builds from
// initialising Firebase before runtime environment variables are available.
export function getAuthClient() {
  return getAuth(getFirebaseApp());
}

export function getDbClient() {
  return getFirestore(getFirebaseApp());
}

export function getStorageClient() {
  return getStorage(getFirebaseApp());
}
