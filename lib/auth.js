// lib/auth.js
// Auth end to end: register, email verification, login, password reset.
// Covers Dawid's Week 4-5 tasks: "complete sign-up, login and email verification".
// Alina's screens call these functions - she never touches Firebase directly.
//
// CHANGES for #8 (Alina, registration/login/verification/reset-password UI):
//
//   - appUrl() now validates NEXT_PUBLIC_APP_URL up front and throws a
//     synthetic { code: "app/missing-app-url" } error if it's missing or
//     not an absolute http(s) URL. registerStudent calls appUrl("/login")
//     BEFORE createUserWithEmailAndPassword, so a misconfigured env var
//     fails loudly before an account is created, instead of creating the
//     account and then silently failing to send the verification email.
//     resendVerification and resetPassword validate the same way.
//   - sendEmailVerification / sendPasswordResetEmail pass the validated
//     continue URL as actionCodeSettings.url. Per Firebase's docs, this is
//     a continue-URL only - it doesn't change where the emailed link
//     itself points. That requires the Console action-URL configured per
//     template (Authentication -> Templates), which is Dawid/Ionut's side.
//   - Added confirmEmailVerification, verifyResetCode and
//     confirmPasswordReset so /verify-email and /reset-password can
//     complete the oobCode loop themselves, once the Console action URL
//     is pointing at them.
//
// registerStudent persists the PRD-required nationality, intended study
// level and privacy-consent evidence using the allow-listed profile schema.

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
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

/**
 * Builds an absolute URL from NEXT_PUBLIC_APP_URL, validating it first.
 * Throws a synthetic Firebase-style error (with a .code) if the env var is
 * missing or isn't an absolute http(s) URL, so callers can fail before
 * doing anything else (see registerStudent).
 */
function appUrl(path) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (!base || !/^https?:\/\//.test(base)) {
    const error = new Error("NEXT_PUBLIC_APP_URL is missing or invalid.");
    error.code = "app/missing-app-url";
    throw error;
  }

  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Register a new student.
 * 1. Validates NEXT_PUBLIC_APP_URL first - fails before touching Firebase
 *    if it's misconfigured, so we never end up with an account that can't
 *    get a verification email.
 * 2. Creates the Firebase Auth account.
 * 3. Creates the matching /users document (role: "student").
 * 4. Sends the verification email (Firebase's built-in one - Sorin's
 *    custom SMTP templates cover the decision emails, IS-02) and reports
 *    whether the send succeeded so the UI can be honest when it fails.
 */
export async function registerStudent(email, password, fullName, nationality, studyLevel) {
  const continueUrl = appUrl("/login");

  const auth = getAuthClient();
  const db = getDbClient();
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Issue #177: set the Auth displayName so the dashboard can greet by name.
  // Never fatal - the profile document below carries the name regardless.
  try {
    await updateProfile(cred.user, { displayName: fullName });
  } catch (e) {
    console.warn("displayName not set:", e.code || e.message);
  }

  await setDoc(doc(db, "users", cred.user.uid), {
    fullName,
    email,
    role: "student",
    nationality,
    studyLevel,
    privacyConsent: true,
    privacyConsentAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  let verificationEmailSent = true;
  try {
    await sendEmailVerification(cred.user, { url: continueUrl });
  } catch (e) {
    verificationEmailSent = false;
    console.warn("Verification email failed:", e.code || e.message);
  }
  return { user: cred.user, verificationEmailSent };
}

export async function login(email, password) {
  const auth = getAuthClient();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return { user: cred.user, verified: cred.user.emailVerified };
}

/** Re-send the verification email (user must be signed in). */
export async function resendVerification(user) {
  const continueUrl = appUrl("/login");
  return sendEmailVerification(user, { url: continueUrl });
}

/** Password reset - step 1: email the reset link. */
export async function resetPassword(email) {
  const continueUrl = appUrl("/login");
  const auth = getAuthClient();
  return sendPasswordResetEmail(auth, email, { url: continueUrl });
}

/** Sign out. */
export async function logout() {
  try {
    const auth = getAuthClient();
    return await signOut(auth);
  } catch (err) {
    return Promise.resolve();
  }
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

/**
 * Role-scoped sign-in (#196).
 *
 * Authenticates, then confirms the account's role matches the route the person
 * signed in from. A mismatch ends the session immediately - nobody should land
 * on a portal for a role they do not hold, even briefly.
 *
 * IMPORTANT: this is a clarity and routing improvement, NOT a security
 * boundary. The real protection is unchanged and lives where it always has -
 * firestore.rules and storage.rules check role and universityId on every read,
 * whichever page the request came from. A student who reached /admin by any
 * means still cannot read a single application.
 *
 * Asymmetry is deliberate. The admin route fails CLOSED: if the profile cannot
 * be read we refuse, because we cannot positively confirm the person is staff.
 * The student route fails OPEN: a missing profile falls back to the student
 * portal, which is the default and where the rules already confine them. A
 * Firestore hiccup should not lock applicants out of their own dashboard.
 */
export async function loginWithRole(email, password, expectedRole) {
  const auth = getAuthClient();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Verification is still enforced first, exactly as before.
  if (!user.emailVerified) {
    return { user, verified: false, role: null };
  }

  let profile = null;
  let lookupFailed = false;
  try {
    profile = await getUserProfile(user.uid);
  } catch (err) {
    lookupFailed = true;
    console.warn("Profile lookup failed during sign-in:", err.code || err.message);
  }

  const role = profile ? (profile.role === "admin" ? "admin" : "student") : null;

  const refuse =
    expectedRole === "admin"
      ? role !== "admin" // fail closed
      : role === "admin"; // fail open on unknown

  if (refuse) {
    // End the session before returning control to the page.
    await signOut(auth).catch(() => {});
    const error = new Error("This account cannot sign in on this route.");
    error.code =
      lookupFailed && expectedRole === "admin"
        ? "app/role-check-unavailable"
        : "app/wrong-portal";
    throw error;
  }

  return { user, verified: true, role: role || "student" };
}
