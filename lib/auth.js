// lib/auth.js
// Auth end to end: register, email verification, login, password reset.
// Covers Dawid's Week 4-5 tasks: "complete sign-up, login and email verification".
// Elena's screens call these functions - she never touches Firebase directly.
//
// CHANGES for #8 (Elena, registration/login/verification/reset-password UI)
// -- reviewed against Firebase docs, see PR description for citations --
//
//   - sendEmailVerification / sendPasswordResetEmail now pass a minimal
//     actionCodeSettings = { url: appUrl('/login') }. This is a CONTINUE URL
//     ONLY: per Firebase's docs ("Passing State in Email Actions"), `url` in
//     ActionCodeSettings does not change where the email link itself points.
//     It only supplies the link shown on the "Continue" button after
//     Firebase's own hosted action page finishes the verify/reset. It is
//     NOT what makes the email link open directly on OUR /verify-email or
//     /reset-password screens - that requires setting the Console action
//     URL per template (Authentication -> Templates), which is Dawid/
//     Ionut's side to configure, not something this file can do alone.
//     handleCodeInApp was deliberately NOT set: per the same docs, that flag
//     is for opening the link in an installed iOS/Android app, which this
//     project doesn't have - setting it without iOS/android config doesn't
//     do what the original draft assumed it did for a pure web flow.
//   - Added confirmEmailVerification, verifyResetCode and
//     confirmPasswordReset so /verify-email and /reset-password can
//     complete the oobCode loop themselves, once the Console action URL
//     is pointing at them.
//
// registerStudent's signature and Firestore write are UNCHANGED from the
// version on develop - nationality/studyLevel are collected in the UI but
// deliberately NOT persisted here yet; see PR description "Data-model
// decision" for why, and what Dawid/Silvana need to sign off before that
// changes.

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuthClient, getDbClient } from "./firebase";

function appUrl(path) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Register a new student.
 * 1. Creates the Firebase Auth account.
 * 2. Creates the matching /users document (role: "student").
 * 3. Sends the verification email (Firebase's built-in one - Sorin's
 *    custom SMTP templates cover the decision emails, IS-02).
 */
export async function registerStudent(email, password, fullName) {
  const auth = getAuthClient();
  const db = getDbClient();
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    fullName,
    email,
    role: "student",
    universityId: null, // set when they apply
    createdAt: serverTimestamp(),
  });

  await sendEmailVerification(cred.user, { url: appUrl("/login") });
  return cred.user;
}

/**
 * Login. If the email is not verified, we stay signed in (so the
 * verification email can be re-sent) but flag it to the caller.
 */
export async function login(email, password) {
  const auth = getAuthClient();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return { user: cred.user, verified: cred.user.emailVerified };
}

/** Re-send the verification email (user must be signed in). */
export async function resendVerification(user) {
  return sendEmailVerification(user, { url: appUrl("/login") });
}

/** Password reset - step 1: email the reset link. */
export async function resetPassword(email) {
  const auth = getAuthClient();
  return sendPasswordResetEmail(auth, email, { url: appUrl("/login") });
}

/** Sign out. */
export async function logout() {
  const auth = getAuthClient();
  return signOut(auth);
}

/**
 * Get the current user's profile from /users (includes role).
 * The admin module uses role + universityId for scoping.
 */
export async function getUserProfile(uid) {
  const db = getDbClient();
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

/**
 * Subscribe to auth state - for layout-level "am I logged in" checks.
 * Returns the unsubscribe function.
 */
export function watchAuth(callback) {
  const auth = getAuthClient();
  return onAuthStateChanged(auth, callback);
}

/* ---------------- Added for #8: verification link + reset confirm ----------------
 * These only receive a real oobCode once the Console action URL points at
 * /verify-email and /reset-password. Until that's configured, students
 * clicking the emailed link will land on Firebase's own hosted page instead
 * - registration, login and the reset REQUEST step all still work regardless.
 */

/** Applies the oobCode from the emailed verification link. */
export async function confirmEmailVerification(oobCode) {
  const auth = getAuthClient();
  await checkActionCode(auth, oobCode); // throws first if invalid/expired
  await applyActionCode(auth, oobCode);
}

/** Validates a password-reset oobCode and returns the email it belongs to. */
export async function verifyResetCode(oobCode) {
  const auth = getAuthClient();
  return verifyPasswordResetCode(auth, oobCode);
}

/** Password reset - step 2: set the new password using the verified oobCode. */
export async function confirmPasswordReset(oobCode, newPassword) {
  const auth = getAuthClient();
  return firebaseConfirmPasswordReset(auth, oobCode, newPassword);
}
