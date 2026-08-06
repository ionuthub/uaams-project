// scripts/seed.js
// Seed script - reference data and the seed-only admin accounts.
// Run locally with the Firebase ADMIN SDK (bypasses security rules on purpose;
// this is why the rules can safely say "admin accounts are seed-only").
//
// Setup:
//   1. Firebase console -> Project settings -> Service accounts ->
//      Generate new private key -> save as serviceAccountKey.json
//      (NEVER commit this file - add it to .gitignore immediately)
//   2. npm install firebase-admin
//   3. Set the seed admin passwords (never committed):
//      PowerShell:  $env:SEED_ADMIN_PASSWORD="your-password"
//                   $env:SEED_ADMIN2_PASSWORD="a-different-password"
//   4. npm run seed
//
// The console output IS the evidence for the Sprint reports - screenshot it.
//
// #193/#25: a SECOND university is seeded so cross-university isolation can
// actually be tested rather than asserted. With one institution the scoping
// rule is unfalsifiable - there is no other university to be refused from.
// Two universities, each with its own admin, make PRD section 7 "support
// multiple universities" demonstrable and turn the one "not testable" row in
// the acceptance record into a real result.
//
// Give the two admins DIFFERENT passwords. Reusing one password across both
// would make the isolation evidence look like a single account in two places.

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const auth = admin.auth();
const now = () => admin.firestore.FieldValue.serverTimestamp();

const UNIVERSITIES = [
  { id: "solent", name: "Southampton Solent University", city: "Southampton" },
  { id: "portsmouth", name: "University of Portsmouth", city: "Portsmouth" },
];

const ADMINS = [
  {
    email: "admin@solent.test",
    password: process.env.SEED_ADMIN_PASSWORD,
    fullName: "Solent Admissions",
    universityId: "solent",
    envVar: "SEED_ADMIN_PASSWORD",
    required: true,
  },
  {
    email: "admin@portsmouth.test",
    password: process.env.SEED_ADMIN2_PASSWORD,
    fullName: "Portsmouth Admissions",
    universityId: "portsmouth",
    envVar: "SEED_ADMIN2_PASSWORD",
    required: false, // skipped with a warning if unset, so old runs still work
  },
];

const primary = ADMINS.find((a) => a.required);
if (!primary.password || primary.password.length < 8) {
  console.error(`Set ${primary.envVar} (min 8 chars) before running, e.g.`);
  console.error(`  PowerShell:  $env:${primary.envVar}="your-password"; npm run seed`);
  process.exit(1);
}

async function seedUniversity(u) {
  await db.collection("universities").doc(u.id).set({ ...u, createdAt: now() });
  console.log(`✔ University seeded: ${u.name} (id: ${u.id})`);
}

async function seedAdmin(a) {
  if (!a.password || a.password.length < 8) {
    console.warn(
      `⚠ Skipping ${a.email}: ${a.envVar} is not set (min 8 chars).\n` +
        `  Cross-university isolation cannot be tested without a second admin.`
    );
    return null;
  }

  let user;
  try {
    user = await auth.getUserByEmail(a.email);
    await auth.updateUser(user.uid, { password: a.password });
    console.log(`✔ Admin auth account already exists: ${a.email} (password updated)`);
  } catch {
    user = await auth.createUser({
      email: a.email,
      password: a.password,
      displayName: a.fullName,
      emailVerified: true, // demo account skips verification
    });
    console.log(`✔ Admin auth account created: ${a.email} (${user.uid})`);
  }

  await db.collection("users").doc(user.uid).set({
    fullName: a.fullName,
    email: a.email,
    role: "admin",
    universityId: a.universityId,
    createdAt: now(),
  });
  console.log(`✔ Admin profile written (role: admin, university: ${a.universityId})`);
  return user;
}

async function seed() {
  for (const u of UNIVERSITIES) await seedUniversity(u);

  const seeded = [];
  for (const a of ADMINS) {
    const user = await seedAdmin(a);
    if (user) seeded.push(a);
  }

  console.log("\nSeed complete.");
  seeded.forEach((a) => console.log(`  ${a.email} -> ${a.universityId}`));

  if (seeded.length < 2) {
    console.log(
      "\nOnly one admin seeded. Set SEED_ADMIN2_PASSWORD and re-run to enable\n" +
        "the cross-university isolation test (issue #25 limitation, #193)."
    );
  } else {
    console.log(
      "\nTwo universities with separate admins are live. Each admin should now\n" +
        "see only their own institution's applications - capture that as evidence."
    );
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
