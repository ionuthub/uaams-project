// scripts/load-probe.mjs
// Bounded load evidence for #234 (PRD-NFR-06).
//
// WHAT THIS IS AND IS NOT
// The PRD asks for thousands of concurrent users. This script does NOT
// demonstrate that, and its output must never be cited as if it did. It
// replaces an unevidenced claim with a real measurement at bounded
// concurrency, plus a clearly labelled extrapolation. Target register state
// is Partial, not Aligned.
//
// READ-ONLY BY DESIGN. It signs in as the existing test accounts and issues
// concurrent READS of real queries - the admin queue and the student
// dashboard. It creates nothing, so runs do not pollute the data.
//
// GUARDRAILS
// - Stop if Firebase quota warnings appear.
// - Do not run while anyone is demoing or testing.
// - Concurrency capped at 50 per level.
//
// USAGE
//   node --env-file=.env.local scripts/load-probe.mjs
//
// Needs VERIFY_STUDENT_EMAIL/PASSWORD and VERIFY_ADMIN_EMAIL/PASSWORD.
// The console output IS the evidence - paste it into #234 with the date
// and the production build it ran against.

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";

const LEVELS = [10, 25, 50];

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
  console.error("Missing environment variables:", missing.join(", "));
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

function percentile(sorted, p) {
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}

async function timeOnce(makeQuery) {
  const start = performance.now();
  const snap = await getDocs(makeQuery());
  return { ms: performance.now() - start, docs: snap.size };
}

async function runLevel(label, makeQuery, n) {
  const results = await Promise.all(
    Array.from({ length: n }, () => timeOnce(makeQuery))
  );
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  console.log(
    "  " + label.padEnd(12) +
    "n=" + String(n).padEnd(5) +
    "p50=" + percentile(times, 50).toFixed(0) + "ms  " +
    "p95=" + percentile(times, 95).toFixed(0) + "ms  " +
    "max=" + times[times.length - 1].toFixed(0) + "ms  " +
    "docs/req=" + results[0].docs
  );
}

async function run() {
  console.log("Load probe - " + new Date().toISOString());
  console.log("Project: " + process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Read-only. Levels: " + LEVELS.join(", "));
  console.log("");

  const officer = await signInWithEmailAndPassword(
    auth, process.env.VERIFY_ADMIN_EMAIL, process.env.VERIFY_ADMIN_PASSWORD
  );
  const profSnap = await getDocs(
    query(collection(db, "users"), where("__name__", "==", officer.user.uid))
  );
  const universityId = profSnap.empty ? null : profSnap.docs[0].data().universityId;
  if (!universityId) {
    console.error("Officer profile has no universityId; cannot probe the queue.");
    process.exit(1);
  }
  console.log("Admin queue reads (" + universityId + "):");
  for (const n of LEVELS) {
    await runLevel("queue", () =>
      query(collection(db, "applications"), where("universityId", "==", universityId)), n);
  }

  const student = await signInWithEmailAndPassword(
    auth, process.env.VERIFY_STUDENT_EMAIL, process.env.VERIFY_STUDENT_PASSWORD
  );
  console.log("Student dashboard reads:");
  for (const n of LEVELS) {
    await runLevel("dashboard", () =>
      query(collection(db, "applications"), where("studentUid", "==", student.user.uid)), n);
  }

  console.log("");
  console.log("MEASURED: the latencies above, at the concurrency shown, on this date.");
  console.log("NOT MEASURED: thousands of concurrent users. Any claim beyond these");
  console.log("numbers is extrapolation and must be labelled as such in the register.");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Probe failed:", error);
    process.exit(1);
  });
