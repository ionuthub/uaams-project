// scripts/seed.js
// Seed script — Dawid's Week 5 task: "add sample university and admin data".
// Run locally with the Firebase ADMIN SDK (bypasses security rules on purpose;
// this is why the rules can safely say "admin accounts are seed-only").
//
// Setup:
//   1. Firebase console -> Project settings -> Service accounts ->
//      Generate new private key -> save as serviceAccountKey.json
//      (NEVER commit this file — add it to .gitignore immediately)
//   2. npm install firebase-admin
//   3. Set the seed admin password (never committed):
//      PowerShell:  $env:SEED_ADMIN_PASSWORD="your-password"
//   4. npm run seed
//
// The console output IS the evidence for the Sprint 2 report
// ("Foundations live... seed output" milestone) — screenshot it.

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const auth = admin.auth();

const UNIVERSITY = {
  id: "solent",
  name: "Southampton Solent University",
  city: "Southampton",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

const ADMIN_USER = {
  email: "admin@solent.test",
  password: process.env.SEED_ADMIN_PASSWORD,
  fullName: "Admin",
};

if (!ADMIN_USER.password || ADMIN_USER.password.length < 8) {
  console.error("Set SEED_ADMIN_PASSWORD (min 8 chars) before running, e.g.");
  console.error('  PowerShell:  $env:SEED_ADMIN_PASSWORD="your-password"; npm run seed');
  process.exit(1);
}

async function seed() {
  // 1. University
  await db.collection("universities").doc(UNIVERSITY.id).set(UNIVERSITY);
  console.log(`✔ University seeded: ${UNIVERSITY.name} (id: ${UNIVERSITY.id})`);

  // 2. Admin auth account (idempotent: reuse if it already exists)
  let user;
  try {
    user = await auth.getUserByEmail(ADMIN_USER.email);
    await auth.updateUser(user.uid, { password: ADMIN_USER.password });
    console.log(`✔ Admin auth account already exists: ${user.uid} (password updated)`);
  } catch {
    user = await auth.createUser({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      displayName: ADMIN_USER.fullName,
      emailVerified: true, // demo account skips verification
    });
    console.log(`✔ Admin auth account created: ${user.uid}`);
  }

  // 3. Admin profile doc with role + university scoping
  await db.collection("users").doc(user.uid).set({
    fullName: ADMIN_USER.fullName,
    email: ADMIN_USER.email,
    role: "admin",
    universityId: UNIVERSITY.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✔ Admin profile written (role: admin, university: ${UNIVERSITY.id})`);

  console.log("\nSeed complete. Admin login:", ADMIN_USER.email);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
