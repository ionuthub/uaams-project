// scripts/verify-delete-refusals.mjs
// Evidence for #193: prove that deletion is REFUSED, rather than asserting it
// by reading the rules.
//
// WHY THIS EXISTS
// firestore.rules says `allow delete: if false` for applications, decisions and
// user profiles, and the interface offers no delete controls. Neither of those
// is evidence. A rule you have read is a claim; a refused attempt is a result.
// This script makes four real attempts and records exactly what comes back.
//
// CRITICAL - WHY THIS DOES NOT USE firebase-admin
// scripts/seed.js uses the Admin SDK, which BYPASSES security rules by design.
// Running these attempts through the Admin SDK would DELETE THE RECORDS and
// prove nothing whatsoever. This script uses the ordinary client SDK and signs
// in as a real user, exactly as the browser does, so every request is actually
// evaluated by the rules. Do not "simplify" it by reusing the seed setup.
//
// SAFETY
// - Only applications belonging to the named test applicant are targeted. If
//   none is found the attempt is reported as NOT RUN rather than falling back
//   to a real applicant record.
// - Nothing is created and nothing is modified. Every attempt is expected to
//   fail. A success is a finding, not a pass - stop and report it.
//
// USAGE
//   node --env-file=.env.local scripts/verify-delete-refusals.mjs
//
// Additional variables needed in the environment or .env.local:
//   VERIFY_STUDENT_EMAIL / VERIFY_STUDENT_PASSWORD   the Playwright test student
//   VERIFY_ADMIN_EMAIL   / VERIFY_ADMIN_PASSWORD     an admissions officer
//
// The console output IS the evidence. Paste it into the test record and attach
// it to #193.

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from "firebase/firestore";

const APPLICANT = process.env.VERIFY_APPLICANT_NAME || "Playwright Test Student";

const REQUIRED = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "VERIFY_STUDENT_EMAIL",
  "VERIFY_STUDENT_PASSWORD",
  "VERIFY_ADMIN_EMAIL",
  "VERIFY_ADMIN_PASSWORD",
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("Missing required environment variables:");
  missing.forEach((key) => console.error("  " + key));
  console.error("");
  console.error("Run with: node --env-file=.env.local scripts/verify-delete-refusals.mjs");
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

// The whole point of the script. A thrown permission-denied is the PASS.
async function attemptDelete(name, ref) {
  try {
    await deleteDoc(ref);
    record(
      name,
      "ALLOWED",
      "The delete SUCCEEDED. This is a security finding - stop and report it."
    );
  } catch (error) {
    record(name, "refused", error.code + ": " + error.message);
  }
}

async function run() {
  console.log("Project:   " + process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Applicant: " + APPLICANT);
  console.log("Date:      " + new Date().toISOString());

  // ---- Student: their own records ----
  console.log("");
  console.log("Signed in as the student (" + process.env.VERIFY_STUDENT_EMAIL + "):");
  const student = await signInWithEmailAndPassword(
    auth,
    process.env.VERIFY_STUDENT_EMAIL,
    process.env.VERIFY_STUDENT_PASSWORD
  );

  const mine = await getDocs(
    query(collection(db, "applications"), where("studentUid", "==", student.user.uid))
  );

  const draft = mine.docs.find((d) => d.data().status === "draft");
  if (draft) {
    await attemptDelete("student deletes their own draft", doc(db, "applications", draft.id));
  } else {
    record("student deletes their own draft", "NOT RUN", "No draft on this account.");
  }

  const sent = mine.docs.find((d) => d.data().status !== "draft");
  if (sent) {
    await attemptDelete(
      "student deletes their own submitted application",
      doc(db, "applications", sent.id)
    );
  } else {
    record(
      "student deletes their own submitted application",
      "NOT RUN",
      "No submitted application on this account."
    );
  }

  await signOut(auth);

  // ---- Admissions officer: their own university, and the audit log ----
  console.log("");
  console.log("Signed in as the admissions officer (" + process.env.VERIFY_ADMIN_EMAIL + "):");
  const officer = await signInWithEmailAndPassword(
    auth,
    process.env.VERIFY_ADMIN_EMAIL,
    process.env.VERIFY_ADMIN_PASSWORD
  );
  const profile = await getDoc(doc(db, "users", officer.user.uid));
  const universityId = profile.exists() ? profile.data().universityId : null;

  if (!universityId) {
    record("admin deletes an application at their own university", "NOT RUN", "No universityId on this account.");
    record("admin deletes an entry from the decision history", "NOT RUN", "No universityId on this account.");
    await signOut(auth);
    return;
  }

  const queue = await getDocs(
    query(collection(db, "applications"), where("universityId", "==", universityId))
  );
  // Deliberately narrow: only the test applicant, never a real one.
  const target = queue.docs.find((d) => (d.data().form || {}).fullName === APPLICANT);

  if (!target) {
    const note = "No " + APPLICANT + " application at " + universityId + ".";
    record("admin deletes an application at their own university", "NOT RUN", note);
    record("admin deletes an entry from the decision history", "NOT RUN", note);
    await signOut(auth);
    return;
  }

  const decisions = await getDocs(
    query(collection(db, "applications", target.id, "decisions"), limit(1))
  );

  // Decisions first: deleting the application would remove the subcollection
  // path this attempt depends on, if it were ever allowed.
  if (decisions.empty) {
    record(
      "admin deletes an entry from the decision history",
      "NOT RUN",
      "No decision recorded against " + target.id + " yet."
    );
  } else {
    await attemptDelete(
      "admin deletes an entry from the decision history",
      doc(db, "applications", target.id, "decisions", decisions.docs[0].id)
    );
  }

  await attemptDelete(
    "admin deletes an application at their own university",
    doc(db, "applications", target.id)
  );

  await signOut(auth);
}

run()
  .then(() => {
    const allowed = results.filter((r) => r.outcome === "ALLOWED");
    const notRun = results.filter((r) => r.outcome === "NOT RUN");
    console.log("");
    console.log("-".repeat(64));
    if (allowed.length > 0) {
      console.log(allowed.length + " of " + results.length + " deletes were ALLOWED.");
      console.log("This is a security finding. Report it before doing anything else.");
      process.exit(1);
    }
    console.log("All " + (results.length - notRun.length) + " attempted deletes were refused.");
    if (notRun.length > 0) {
      console.log(
        notRun.length + " attempt(s) could not run - record them as not run, not as passes."
      );
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("Script failed before completing:", error);
    console.error("No conclusion can be drawn from a partial run.");
    process.exit(2);
  });
