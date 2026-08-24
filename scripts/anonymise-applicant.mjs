// scripts/anonymise-applicant.mjs
// GDPR erasure via anonymisation (#233, PRD-NFR-08).
//
// WHY ANONYMISATION AND NOT DELETION
// The decision history is append-only and #193 proved records cannot be
// deleted. Erasure-on-request pulls directly against both. The resolution is
// the standard one: strip everything that identifies the person and destroy
// their documents, while the institutional record - that an application
// existed and was decided - survives against a pseudonymous reference.
//
// WHY A SCRIPT AND NOT A BUTTON
// Erasure is an operator action with legal weight. A request arrives, a human
// verifies the requester is who they claim, an operator runs this. The
// service account key is the gate, exactly as with admin provisioning (#195).
//
// SAFETY
// - Dry run by default. Nothing changes without --confirm.
// - Takes ONE email address and touches only that person.
// - Decision history is never modified.
// - The erasure log records THAT an erasure happened and which application
//   references were affected - never who the person was. Logging the identity
//   would defeat the erasure.
//
// USAGE
//   node scripts/anonymise-applicant.mjs --email person@example.com
//   node scripts/anonymise-applicant.mjs --email person@example.com --confirm
//
// Needs serviceAccountKey.json in the project root. There is no undo.

import fs from "node:fs";
import crypto from "node:crypto";
import admin from "firebase-admin";

const ERASED = "[erased]";
// Fields in application.form that identify a person. courseName, intake and
// universityName stay - they describe the application, not the applicant.
const FORM_FIELDS = [
  "fullName",
  "dateOfBirth",
  "nationality",
  "passportNumber",
  "phone",
  "address",
  "previousQualification",
  "institutionName",
  "graduationYear",
  "gpa",
  "personalStatement",
];

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const email = (arg("--email") || "").trim().toLowerCase();
const CONFIRM = process.argv.includes("--confirm");

if (!email.includes("@")) {
  console.error("Usage: node scripts/anonymise-applicant.mjs --email person@example.com [--confirm]");
  process.exit(2);
}

const keyPath = new URL("../serviceAccountKey.json", import.meta.url);
if (!fs.existsSync(keyPath)) {
  console.error("serviceAccountKey.json not found in the project root.");
  console.error("Only someone holding that key can erase - that is the point.");
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
});
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket(
  process.env.FIREBASE_STORAGE_BUCKET || "uaams-53262.firebasestorage.app"
);

async function run() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      console.error("No account exists for " + email + ". Nothing to erase.");
      process.exit(1);
    }
    throw error;
  }

  const profileRef = db.collection("users").doc(user.uid);
  const profile = await profileRef.get();
  if (profile.exists && profile.data().role === "admin") {
    console.error("That address belongs to an admissions officer, not an applicant.");
    console.error("Staff offboarding is a different process. Refusing.");
    process.exit(1);
  }

  const apps = await db
    .collection("applications")
    .where("studentUid", "==", user.uid)
    .get();

  // Collect the storage paths recorded on each application.
  const files = [];
  for (const doc of apps.docs) {
    const data = doc.data();
    if (data.documentPath) files.push(data.documentPath);
    for (const entry of Object.values(data.documents || {})) {
      if (entry && entry.path) files.push(entry.path);
    }
  }

  const notices = await db
    .collection("notifications")
    .where("userId", "==", user.uid)
    .get();

  console.log("Erasure plan for uid " + user.uid);
  console.log("  applications to anonymise: " + apps.size);
  apps.docs.forEach((d) => console.log("    " + d.id + "  [" + (d.data().status || "?") + "]"));
  console.log("  stored documents to delete: " + files.length);
  console.log("  notifications to delete:    " + notices.size);
  console.log("  profile: anonymise; auth account: disable and scrub");
  console.log("  decision history: UNTOUCHED, by design");

  if (!CONFIRM) {
    console.log("");
    console.log("DRY RUN - nothing was changed. Re-run with --confirm to erase.");
    console.log("There is no undo. Verify the request is genuine first.");
    return;
  }

  // 1. Documents first: personal data in Storage is the highest-risk copy.
  let deleted = 0;
  for (const path of files) {
    try {
      await bucket.file(path).delete();
      deleted += 1;
    } catch (error) {
      if (error?.code !== 404) throw error; // already gone is fine
    }
  }
  console.log("deleted " + deleted + " stored documents");

  // 2. Applications: strip identity, keep the record.
  for (const doc of apps.docs) {
    const updates = {
      documentPath: admin.firestore.FieldValue.delete(),
      documents: admin.firestore.FieldValue.delete(),
      anonymisedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    for (const field of FORM_FIELDS) {
      updates["form." + field] = ERASED;
    }
    await doc.ref.update(updates);
    console.log("anonymised application " + doc.id);
  }

  // 3. Notifications reference the person directly; delete rather than strip.
  for (const n of notices.docs) await n.ref.delete();
  console.log("deleted " + notices.size + " notifications");

  // 4. Profile.
  if (profile.exists) {
    await profileRef.update({
      fullName: ERASED,
      email: ERASED,
      nationality: admin.firestore.FieldValue.delete(),
      studyLevel: admin.firestore.FieldValue.delete(),
      anonymisedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("anonymised profile");
  }

  // 5. Auth account: disable, and replace the address so the identity is gone
  //    from the auth record too. The random address keeps the row unique.
  await auth.updateUser(user.uid, {
    disabled: true,
    email: "erased-" + crypto.randomBytes(8).toString("hex") + "@erased.invalid",
    displayName: ERASED,
  });
  console.log("disabled and scrubbed auth account");

  // 6. Log that an erasure happened - never who.
  await db.collection("erasureLog").add({
    applicationRefs: apps.docs.map((d) => d.id),
    documentsDeleted: deleted,
    performedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("erasure logged (references only, no identity)");

  console.log("");
  console.log("Done. The decision history was not modified.");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("");
    console.error("Failed partway:", error);
    console.error("Re-run the dry run to see the current state before retrying.");
    process.exit(1);
  });
