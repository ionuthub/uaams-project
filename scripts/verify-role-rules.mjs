// scripts/verify-role-rules.mjs
// Evidence for the two claims left over from #195, and for #192.
//
// WHY THIS EXISTS
// #195 was closed as a decision: admin accounts stay seed-provisioned, with no
// public sign-up. Two supporting claims were made in that decision and neither
// had ever been demonstrated:
//
//   1. An address already used by an admin cannot be registered as a student.
//      True because Firebase Authentication allows one account per email across
//      the whole project - but true by argument, not by evidence.
//   2. Nobody can make themselves an admin. firestore.rules forces any
//      self-created profile to role == student and allows only fullName to be
//      updated afterwards. Again: read, never tried.
//
// This turns both into results. Same approach as scripts/verify-delete-refusals.mjs.
//
// CRITICAL - CLIENT SDK ONLY
// The Admin SDK bypasses security rules by design. Every attempt here would
// SUCCEED under it and prove the opposite of what we want. This uses the
// ordinary client SDK, exactly as a browser would.
//
// USAGE
//   node --env-file=.env.local scripts/verify-role-rules.mjs
//
// Needs, alongside the NEXT_PUBLIC_FIREBASE_* values:
//   VERIFY_STUDENT_EMAIL / VERIFY_STUDENT_PASSWORD   the shared test student
//   VERIFY_ADMIN_EMAIL                               an admin ADDRESS only -
//                                                    no admin password needed
//
// The console output IS the evidence.

import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getFirestore, setDoc, updateDoc } from "firebase/firestore";

const REQUIRED = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "VERIFY_STUDENT_EMAIL",
  "VERIFY_STUDENT_PASSWORD",
  "VERIFY_ADMIN_EMAIL",
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("Missing required environment variables:");
  missing.forEach((key) => console.error("  " + key));
  console.error("");
  console.error("Run with: node --env-file=.env.local scripts/verify-role-rules.mjs");
  process.exit(2);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];

function record(name, outcome, detail) {
  results.push({ name, outcome, detail });
  console.log("  " + outcome.padEnd(10) + name);
  if (detail) console.log("             " + detail);
}

async function attempt(name, action, successWarning) {
  try {
    await action();
    record(name, "ALLOWED", successWarning);
  } catch (error) {
    record(name, "refused", error.code + ": " + error.message);
  }
}

async function run() {
  console.log("Project: " + process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Date:    " + new Date().toISOString());

  // ---- 1. An admin address cannot be registered as a student ----
  // No admin password required. The point is that registration is refused
  // before an account is ever created, so knowing the password is irrelevant.
  console.log("");
  console.log("Registration, signed out:");
  await attempt(
    "register an admin address as a new student (" + process.env.VERIFY_ADMIN_EMAIL + ")",
    () =>
      createUserWithEmailAndPassword(
        auth,
        process.env.VERIFY_ADMIN_EMAIL,
        "Throwaway-" + Date.now() + "!"
      ),
    "An account was CREATED on an admin address. Delete it and report this."
  );

  // ---- 2. A signed-in student cannot promote themselves ----
  console.log("");
  console.log("Signed in as the student (" + process.env.VERIFY_STUDENT_EMAIL + "):");
  const student = await signInWithEmailAndPassword(
    auth,
    process.env.VERIFY_STUDENT_EMAIL,
    process.env.VERIFY_STUDENT_PASSWORD
  );
  const uid = student.user.uid;

  await attempt(
    "student sets role: admin on their own profile",
    () => updateDoc(doc(db, "users", uid), { role: "admin" }),
    "PRIVILEGE ESCALATION. Set this profile back to role: student immediately."
  );

  await attempt(
    "student grants themselves a university scope",
    () => updateDoc(doc(db, "users", uid), { universityId: "solent" }),
    "The profile was modified. Revert universityId and report this."
  );

  // Reading another profile is already denied; writing one would be worse.
  await attempt(
    "student overwrites somebody else's profile",
    () =>
      setDoc(doc(db, "users", "not-a-real-uid-" + Date.now()), {
        fullName: "Escalation probe",
        role: "admin",
      }),
    "A profile was written for another user. Delete it and report this."
  );

  await signOut(auth);
}

run()
  .then(() => {
    const allowed = results.filter((r) => r.outcome === "ALLOWED");
    console.log("");
    console.log("-".repeat(64));
    if (allowed.length > 0) {
      console.log(allowed.length + " of " + results.length + " attempts were ALLOWED.");
      console.log("This is a security finding. Report it before doing anything else,");
      console.log("and follow the remediation note printed against each one.");
      process.exit(1);
    }
    console.log("All " + results.length + " attempts were refused.");
    console.log("Admin provisioning stays seed-only, and it is now demonstrated (#195).");
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("Script failed before completing:", error);
    console.error("No conclusion can be drawn from a partial run.");
    process.exit(2);
  });
