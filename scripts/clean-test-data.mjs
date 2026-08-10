// scripts/clean-test-data.mjs
// Remove accumulated Playwright test applications from production.
//
// WHY THIS EXISTS
// Every e2e run creates a real application and there is no cleanup step (a
// recorded limitation). Runs #13-#18 also submitted to the wrong university,
// so both queues now carry noise. This clears it before a demo without
// emptying the queues completely.
//
// WHY THE ADMIN SDK
// firestore.rules sets `allow delete: if false` on applications and decisions,
// and issue #193 proved those refusals are real. Deletion is therefore only
// possible through the Admin SDK, which bypasses rules by design. That is the
// whole reason this file is dangerous and the dry run is the default.
//
// SAFETY
// - Dry run unless --confirm is passed. Nothing is touched without it.
// - Only applications whose applicant name matches EXACTLY are considered.
//   Real applicants are never candidates.
// - Keeps the newest few per university so the queue, the status badges and
//   the by-stage chart still have something to show.
// - Uses recursiveDelete so the decisions and notes subcollections go too.
//   Deleting a document in the Firebase console does NOT remove those, which
//   is how orphaned records get left behind.
//
// USAGE
//   node scripts/clean-test-data.mjs                  # dry run, shows the plan
//   node scripts/clean-test-data.mjs --confirm        # actually delete
//   node scripts/clean-test-data.mjs --keep 3 --confirm
//
// Needs serviceAccountKey.json in the project root, same as the seed script.
// There is no undo. Read the dry run before passing --confirm.

import fs from "node:fs";
import admin from "firebase-admin";

const APPLICANT = process.env.CLEAN_APPLICANT_NAME || "Playwright Test Student";

const args = process.argv.slice(2);
const CONFIRM = args.includes("--confirm");
const keepFlag = args.indexOf("--keep");
const KEEP = keepFlag >= 0 ? Number(args[keepFlag + 1]) : 2;

if (!Number.isInteger(KEEP) || KEEP < 0) {
  console.error("--keep needs a whole number of applications to preserve per university.");
  process.exit(2);
}

const keyPath = new URL("../serviceAccountKey.json", import.meta.url);
if (!fs.existsSync(keyPath)) {
  console.error("serviceAccountKey.json not found in the project root.");
  console.error("Firebase console -> Project settings -> Service accounts -> Generate new private key.");
  console.error("Never commit that file.");
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
});
const db = admin.firestore();

const millis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : 0;

async function run() {
  const snap = await db.collection("applications").get();

  // Exact match only. A partial or case-insensitive match could pick up a real
  // applicant with a similar name, and there is no undo.
  const candidates = snap.docs.filter(
    (d) => (d.data().form || {}).fullName === APPLICANT
  );
  const untouched = snap.size - candidates.length;

  console.log("Applicant filter: " + APPLICANT);
  console.log("Applications in total: " + snap.size);
  console.log("Matching the filter:   " + candidates.length);
  console.log("Left alone entirely:   " + untouched);
  console.log("Keeping per university: " + KEEP);
  console.log("");

  if (candidates.length === 0) {
    console.log("Nothing matches. No action needed.");
    return;
  }

  const byUniversity = new Map();
  for (const doc of candidates) {
    const uni = doc.data().universityId || "(none)";
    if (!byUniversity.has(uni)) byUniversity.set(uni, []);
    byUniversity.get(uni).push(doc);
  }

  const doomed = [];
  for (const [uni, docs] of byUniversity) {
    // Newest first, so the ones kept are the most recently created.
    docs.sort(
      (a, b) =>
        millis(b.data().submittedAt || b.data().createdAt) -
        millis(a.data().submittedAt || a.data().createdAt)
    );
    console.log(uni + ":");
    docs.forEach((doc, index) => {
      const keep = index < KEEP;
      if (!keep) doomed.push(doc);
      console.log(
        "  " + (keep ? "KEEP  " : "DELETE") + "  " + doc.id +
        "  [" + (doc.data().status || "?") + "]"
      );
    });
    console.log("");
  }

  console.log("To delete: " + doomed.length + "   To keep: " + (candidates.length - doomed.length));

  if (doomed.length === 0) {
    console.log("Nothing to remove at this --keep level.");
    return;
  }

  if (!CONFIRM) {
    console.log("");
    console.log("DRY RUN - nothing was changed.");
    console.log("Read the list above. If it is all test data, re-run with --confirm.");
    return;
  }

  const removedIds = new Set();
  for (const doc of doomed) {
    // recursiveDelete takes the decisions and notes subcollections with it.
    await db.recursiveDelete(doc.ref);
    removedIds.add(doc.id);
    console.log("deleted application " + doc.id);
  }

  // Notifications and email logs that point at a deleted application would
  // otherwise linger - the student dashboard would show alerts linking to
  // records that no longer exist.
  for (const collection of ["notifications", "emailLogs"]) {
    const all = await db.collection(collection).get();
    const orphans = all.docs.filter((d) => removedIds.has(d.data().applicationId));
    for (const orphan of orphans) await orphan.ref.delete();
    console.log("deleted " + orphans.length + " " + collection + " entries");
  }

  console.log("");
  console.log("Done. " + removedIds.size + " applications removed, " + (candidates.length - doomed.length) + " kept.");
  console.log("Check both admin queues before demoing.");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("");
    console.error("Failed:", error);
    console.error("Some records may already have been removed. Re-run the dry run to see the current state.");
    process.exit(1);
  });
