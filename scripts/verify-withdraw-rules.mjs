// scripts/verify-withdraw-rules.mjs
// Negative-path evidence for #194, the sibling of verify-delete-refusals.mjs.
//
// WHY THIS EXISTS
// Withdrawal is the one case where a student may change an application after
// submission, so the rule is deliberately narrow: only the owner, only from
// submitted or under_review, only to withdrawn, only three fields. Reading that
// rule is not evidence. This attempts to break each clause and records what
// comes back.
//
// CRITICAL - CLIENT SDK ONLY
// The Admin SDK bypasses rules. Every attempt here would SUCCEED under it and
// prove the opposite of what we want. Do not "simplify" this by reusing the
// setup in seed.js or clean-test-data.mjs.
//
// HOW THIS DIFFERS FROM THE DELETION TESTS
// A refused delete changes nothing. A withdrawal that wrongly SUCCEEDED would
// leave an application in a false state - withdrawn by the wrong person, or a
// withdrawal undone. Each attempt therefore prints its own remediation line,
// and the script stops at the first success rather than continuing.
//
// USAGE
//   node --env-file=.env.local scripts/verify-withdraw-rules.mjs
//
// Needs, alongside NEXT_PUBLIC_FIREBASE_*:
//   VERIFY_STUDENT_EMAIL / VERIFY_STUDENT_PASSWORD
//   VERIFY_ADMIN_EMAIL   / VERIFY_ADMIN_PASSWORD
//
// The console output IS the evidence.

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

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
let stopped = false;

function record(name, outcome, detail) {
  results.push({ name, outcome, detail });
  console.log("  " + outcome.padEnd(10) + name);
  if (detail) console.log("             " + detail);
}

// A refusal is the pass. A success halts everything.
async function attempt(name, action, remediation) {
  if (stopped) {
    record(name, "SKIPPED", "Stopped after an earlier attempt was allowed.");
    return;
  }
  try {
    await action();
    stopped = true;
    record(name, "ALLOWED", remediation);
  } catch (error) {
    record(name, "refused", error.code + ": " + error.message);
  }
}

function ref(id) {
  return doc(db, "applications", id);
}

async function run() {
  console.log("Project: " + process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("Date:    " + new Date().toISOString());

  // ---- Find a target owned by somebody else, while we have admin sight ----
  // Read as the admin, attempt as the student. The student cannot even read
  // this record, which is the point.
  const officer = await signInWithEmailAndPassword(
    auth,
    process.env.VERIFY_ADMIN_EMAIL,
    process.env.VERIFY_ADMIN_PASSWORD
  );
  const officerProfile = await getDocs(
    query(collection(db, "users"), where("__name__", "==", officer.user.uid))
  );
  const universityId = officerProfile.empty
    ? null
    : officerProfile.docs[0].data().universityId;

  let othersApplication = null;
  let ownedByStudent = [];

  if (universityId) {
    const queueSnapshot = await getDocs(
      query(collection(db, "applications"), where("universityId", "==", universityId))
    );
    // Signed in as the student in a moment, so remember only the ids.
    othersApplication = queueSnapshot.docs[0] ? queueSnapshot.docs[0].id : null;
  }

  // ---- Admin attempts a withdrawal on the student behalf ----
  console.log("");
  console.log("Signed in as the admissions officer:");
  if (othersApplication) {
    await attempt(
      "admin withdraws an application on the student behalf",
      () =>
        updateDoc(ref(othersApplication), {
          status: "withdrawn",
          updatedAt: serverTimestamp(),
        }),
      "An officer withdrew an applicant application. Restore its previous status and report this."
    );
  } else {
    record("admin withdraws an application on the student behalf", "NOT RUN", "No application found at this university.");
  }

  await signOut(auth);

  // ---- Student attempts ----
  console.log("");
  console.log("Signed in as the student:");
  const student = await signInWithEmailAndPassword(
    auth,
    process.env.VERIFY_STUDENT_EMAIL,
    process.env.VERIFY_STUDENT_PASSWORD
  );

  const mine = await getDocs(
    query(collection(db, "applications"), where("studentUid", "==", student.user.uid))
  );
  ownedByStudent = mine.docs;

  const byStatus = (wanted) => ownedByStudent.find((d) => d.data().status === wanted);
  const notMine = othersApplication && !ownedByStudent.some((d) => d.id === othersApplication)
    ? othersApplication
    : null;

  // 1. Somebody else application.
  if (notMine) {
    await attempt(
      "student withdraws somebody else application",
      () => updateDoc(ref(notMine), { status: "withdrawn", updatedAt: serverTimestamp() }),
      "One applicant withdrew another application. Restore it and report this immediately."
    );
  } else {
    record("student withdraws somebody else application", "NOT RUN", "No application owned by another student was available.");
  }

  // 2. A draft was never submitted, so there is nothing to withdraw from.
  const draft = byStatus("draft");
  if (draft) {
    await attempt(
      "student withdraws a draft",
      () => updateDoc(ref(draft.id), { status: "withdrawn", updatedAt: serverTimestamp() }),
      "A draft was withdrawn. Set it back to draft."
    );
  } else {
    record("student withdraws a draft", "NOT RUN", "No draft on this account.");
  }

  // 3. A decision is never rewritten.
  const decided = byStatus("offer") || byStatus("rejected");
  if (decided) {
    await attempt(
      "student withdraws an application already decided",
      () => updateDoc(ref(decided.id), { status: "withdrawn", updatedAt: serverTimestamp() }),
      "A decided application was withdrawn. Restore status " + decided.data().status + "."
    );
  } else {
    record("student withdraws an application already decided", "NOT RUN", "No decided application on this account.");
  }

  // 4. The one that matters most: withdrawn is terminal. It is absent from the
  //    from-list on purpose, so a withdrawal can never become an offer.
  const withdrawn = byStatus("withdrawn");
  if (withdrawn) {
    await attempt(
      "student undoes a withdrawal, back to submitted",
      () => updateDoc(ref(withdrawn.id), { status: "submitted", updatedAt: serverTimestamp() }),
      "A withdrawal was undone. Set it back to withdrawn and report this."
    );
    await attempt(
      "student turns a withdrawal into an offer",
      () => updateDoc(ref(withdrawn.id), { status: "offer", updatedAt: serverTimestamp() }),
      "A withdrawal became an offer. Set it back to withdrawn and report this immediately."
    );
  } else {
    record("student undoes a withdrawal", "NOT RUN", "No withdrawn application on this account.");
    record("student turns a withdrawal into an offer", "NOT RUN", "No withdrawn application on this account.");
  }

  // 5. Withdrawing must not smuggle other edits through with it.
  const live = byStatus("submitted") || byStatus("under_review");
  if (live) {
    await attempt(
      "student withdraws and edits the form in the same write",
      () =>
        updateDoc(ref(live.id), {
          status: "withdrawn",
          updatedAt: serverTimestamp(),
          "form.fullName": "Changed During Withdrawal",
        }),
      "A form field changed during a withdrawal. Check the record and report this."
    );
  } else {
    record("student withdraws and edits the form in the same write", "NOT RUN", "No submitted or under-review application on this account.");
  }

  await signOut(auth);
}

run()
  .then(() => {
    const allowed = results.filter((r) => r.outcome === "ALLOWED");
    const notRun = results.filter((r) => r.outcome === "NOT RUN");
    console.log("");
    console.log("-".repeat(66));
    if (allowed.length > 0) {
      console.log("An attempt was ALLOWED. Everything after it was skipped.");
      console.log("Follow the remediation note above, then report it. Do not re-run.");
      process.exit(1);
    }
    console.log("All " + (results.length - notRun.length) + " attempted writes were refused.");
    if (notRun.length > 0) {
      console.log(notRun.length + " could not run - record them as not run, not as passes.");
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("Script failed before completing:", error);
    console.error("No conclusion can be drawn from a partial run.");
    process.exit(2);
  });
