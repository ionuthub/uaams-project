import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(name + " is not configured on the server.");
    error.code = "server/missing-config";
    throw error;
  }
  return value;
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = requireEnv("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
