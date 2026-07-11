// lib/firebase.js
// Client-side Firebase initialisation for UAAMS.
// Values come from environment variables — never commit real keys (team brief, section 7).
// In Next.js, client-exposed vars must be prefixed NEXT_PUBLIC_.

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

function getFirebaseApp() {
  if (missingConfig.length) {
    throw new Error(
      `Firebase configuration is missing: ${missingConfig.join(", ")}. ` +
        "Add the NEXT_PUBLIC_FIREBASE_* variables to the runtime environment."
    );
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
