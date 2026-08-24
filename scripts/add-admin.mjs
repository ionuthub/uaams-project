// scripts/add-admin.mjs
// Add ONE admissions officer to ONE university. Nothing else.
//
// WHY THIS EXISTS
// #195 decided admin accounts stay team-provisioned - no public sign-up, no
// invite codes. That decision was sound but left no usable way to act on it:
// the only mechanism was editing the ADMINS array in scripts/seed.js and
// re-running the whole seed.
//
// That is dangerous. seed.js calls updateUser on accounts that already exist,
// so re-running it to add a third officer silently RESETS the passwords of
// admin@solent.test and admin@portsmouth.test to whatever the environment
// happens to hold - which then no longer matches the E2E_ADMIN_PASSWORD secret
// and breaks the test suite at sign-in.
//
// This script refuses to touch anything that already exists.
//
// WHY THE ADMIN SDK IS CORRECT HERE
// Unlike the verify scripts, this one is SUPPOSED to bypass the rules. That is
// the whole security model: firestore.rules forces every self-created profile
// to role == student, so an admin can only be made by someone holding the
// service account key. The key is the gate. Guard it accordingly.
//
// USAGE
//   ADD_ADMIN_PASSWORD="..." node scripts/add-admin.mjs \
//     --email admissions2@solent.test \
//     --name "Solent Admissions (Second Officer)" \
//     --university solent
//
// The password comes from the environment on purpose - command-line arguments
// are written to your shell history in plain text.

import fs from "node:fs";
import admin from "firebase-admin";

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const email = (arg("--email") || "").trim().toLowerCase();
const fullName = (arg("--name") || "").trim();
const universityId = (arg("--university") || "").trim();
const password = process.env.ADD_ADMIN_PASSWORD || "";

const problems = [];
if (!email.includes("@")) problems.push("--email is missing or not an address");
if (!fullName) problems.push("--name is missing");
if (!universityId) problems.push("--university is missing");
if (password.length < 12) {
  problems.push(
    "ADD_ADMIN_PASSWORD must be set and at least 12 characters. This account can",
  );
  problems.push(
    "  read every applicant record at its institution - do not reuse an existing one."
  );
}

if (problems.length > 0) {
  console.error("Cannot continue:");
  problems.forEach((p) => console.error("  " + p));
  console.error("");
  console.error('Example:');
  console.error('  ADD_ADMIN_PASSWORD="..." node scripts/add-admin.mjs \\');
  console.error('    --email admissions2@solent.test \\');
  console.error('    --name "Second Officer" --university solent');
  process.exit(2);
}

const keyPath = new URL("../serviceAccountKey.json", import.meta.url);
if (!fs.existsSync(keyPath)) {
  console.error("serviceAccountKey.json not found in the project root.");
  console.error("Only someone holding that key can create an admin - that is the point.");
  process.exit(2);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
});
const db = admin.firestore();
const auth = admin.auth();

async function run() {
  // The university must already exist, or the new officer signs in to an empty
  // queue and nobody understands why.
  const uni = await db.collection("universities").doc(universityId).get();
  if (!uni.exists) {
    const all = await db.collection("universities").get();
    console.error('No university with id "' + universityId + '".');
    console.error("Known universities:");
    all.docs.forEach((d) => console.error("  " + d.id + "  (" + (d.data().name || "?") + ")"));
    process.exit(1);
  }

  // Refuse rather than overwrite. This is the difference from seed.js.
  try {
    const existing = await auth.getUserByEmail(email);
    console.error("An account already exists for " + email + " (uid " + existing.uid + ").");
    console.error("Refusing to modify it. Firebase allows one account per address,");
    console.error("and silently changing an existing password is how the test suite broke before.");
    process.exit(1);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
  }

  const user = await auth.createUser({
    email,
    password,
    displayName: fullName,
    // Provisioned by the team, so the address is trusted without a round trip.
    emailVerified: true,
  });

  await db.collection("users").doc(user.uid).set({
    fullName,
    email,
    role: "admin",
    universityId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Created admissions officer");
  console.log("  name:       " + fullName);
  console.log("  email:      " + email);
  console.log("  university: " + universityId + " (" + (uni.data().name || "?") + ")");
  console.log("  uid:        " + user.uid);
  console.log("");
  console.log("They can sign in now at /admin/login. Send the password separately,");
  console.log("and ask them to change it. Nothing else was modified.");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("");
    console.error("Failed:", error);
    console.error("Check the Firebase console before re-running - the Auth account may");
    console.error("have been created without its profile.");
    process.exit(1);
  });
