// lib/firebase.js
// Client-side Firebase initialisation for UAAMS.
// Values come from environment variables - never commit real keys (team brief, section 7).
// In Next.js, client-exposed vars must be prefixed NEXT_PUBLIC_.

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Required client-exposed config. No fallback values on purpose: if these are
// missing we fail loudly with one clear error, rather than silently connecting
// to a nonexistent project and surfacing confusing downstream Firebase errors
// on every screen. Matches the honest-failure approach used by appUrl() in
// lib/auth.js.
const REQUIRED_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

function buildFirebaseConfig() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const error = new Error(`Firebase is not configured. Missing: ${missing.join(", ")}.`);
    error.code = "app/missing-firebase-config";
    throw error;
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function getFirebaseApp() {
  // Avoid re-initialising during Next.js hot reload.
  return getApps().length ? getApps()[0] : initializeApp(buildFirebaseConfig());
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
