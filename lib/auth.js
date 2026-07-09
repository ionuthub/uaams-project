// lib/auth.js
// Auth end to end: register, email verification, login, password reset.
// Covers Dawid's Week 4–5 tasks: "complete sign-up, login and email verification".
// Elena's screens call these functions — she never touches Firebase directly.

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Register a new student.
 * 1. Creates the Firebase Auth account.
 * 2. Creates the matching /users document (role: "student").
 * 3. Sends the verification email (Firebase's built-in one — Sorin's
 *    custom SMTP templates cover the decision emails, IS-02).
 */
export async function registerStudent(email, password, fullName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    fullName,
    email,
    role: "student",
    universityId: null, // set when they apply
    createdAt: serverTimestamp(),
  });

  await sendEmailVerification(cred.user);
  return cred.user;
}

/**
 * Login. If the email is not verified, we stay signed in (so the
 * verification email can be re-sent) but flag it to the caller.
 */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return { user: cred.user, verified: cred.user.emailVerified };
}

/** Re-send the verification email (user must be signed in). */
export async function resendVerification(user) {
  return sendEmailVerification(user);
}

/** Password reset. */
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/** Sign out. */
export async function logout() {
  return signOut(auth);
}

/**
 * Get the current user's profile from /users (includes role).
 * The admin module uses role + universityId for scoping.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

/**
 * Subscribe to auth state — for layout-level "am I logged in" checks.
 * Returns the unsubscribe function.
 */
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
