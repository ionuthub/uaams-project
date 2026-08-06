// scripts/seed.js
// Seed script - Dawid's backend task: add sample university, admin, and student data.
// Run locally with the Firebase ADMIN SDK (bypasses security rules on purpose;
// this is why the rules can safely say "admin accounts are seed-only").
//
// Setup:
//   1. Firebase console -> Project settings -> Service accounts ->
//      Generate new private key -> save as serviceAccountKey.json
//      (NEVER commit this file - add it to .gitignore immediately)
//   2. npm install firebase-admin
//   3. Set the seed password (never committed):
//      PowerShell:  $env:SEED_ADMIN_PASSWORD="your-password"
//   4. npm run seed

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

const STUDENT_USER = {
  email: "student@solent.test",
  password: process.env.SEED_ADMIN_PASSWORD,
  fullName: "Demo Student",
  nationality: "United Kingdom",
  studyLevel: "Undergraduate",
};

if (!ADMIN_USER.password || ADMIN_USER.password.length < 8) {
  console.error("Set SEED_ADMIN_PASSWORD (min 8 chars) before running, e.g.");
  console.error('  PowerShell:  $env:SEED_ADMIN_PASSWORD="your-password"; npm run seed');
  process.exit(1);
}

async function seed() {
  // 1. University
  await db.collection("universities").doc(UNIVERSITY.id).set(UNIVERSITY, { merge: true });
  console.log(`✔ University seeded: ${UNIVERSITY.name} (id: ${UNIVERSITY.id})`);

  // 2. Admin auth account & profile (idempotent)
  let adminUser;
  try {
    adminUser = await auth.getUserByEmail(ADMIN_USER.email);
    await auth.updateUser(adminUser.uid, { password: ADMIN_USER.password });
    console.log(`✔ Admin auth account already exists: ${adminUser.uid} (password updated)`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      adminUser = await auth.createUser({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        displayName: ADMIN_USER.fullName,
        emailVerified: true,
      });
      console.log(`✔ Admin auth account created: ${adminUser.uid}`);
    } else {
      throw err;
    }
  }

  await db.collection("users").doc(adminUser.uid).set(
    {
      fullName: ADMIN_USER.fullName,
      email: ADMIN_USER.email,
      role: "admin",
      universityId: UNIVERSITY.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`✔ Admin profile written (role: admin, university: ${UNIVERSITY.id})`);

  // 3. Demo student auth account & profile (idempotent, harness testing)
  let studentUser;
  try {
    studentUser = await auth.getUserByEmail(STUDENT_USER.email);
    await auth.updateUser(studentUser.uid, {
      password: STUDENT_USER.password,
      emailVerified: true,
    });
    console.log(`✔ Demo student auth account already exists: ${studentUser.uid} (password updated)`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      studentUser = await auth.createUser({
        email: STUDENT_USER.email,
        password: STUDENT_USER.password,
        displayName: STUDENT_USER.fullName,
        emailVerified: true,
      });
      console.log(`✔ Demo student auth account created: ${studentUser.uid}`);
    } else {
      throw err;
    }
  }

  await db.collection("users").doc(studentUser.uid).set(
    {
      fullName: STUDENT_USER.fullName,
      email: STUDENT_USER.email,
      role: "student",
      universityId: UNIVERSITY.id,
      nationality: STUDENT_USER.nationality,
      studyLevel: STUDENT_USER.studyLevel,
      privacyConsent: true,
      privacyConsentAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`✔ Demo student ready: ${STUDENT_USER.email} (verified, role: student)`);

  // 4. Demo applications in known states for harness/rule testing
  const appsCol = db.collection("applications");
  const base = {
    studentUid: studentUser.uid,
    universityId: UNIVERSITY.id,
    form: { step1: "seed", step4: "seed" },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const submitted = await appsCol.add({
    ...base,
    status: "submitted",
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const offered = await appsCol.add({
    ...base,
    status: "offer",
    latestDecisionMessage: "Seed offer",
  });

  console.log(`✔ Demo apps seeded: submitted=${submitted.id}, offer=${offered.id}`);

  console.log("\nSeed complete.");
  console.log("  Admin login:  ", ADMIN_USER.email);
  console.log("  Student login:", STUDENT_USER.email);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });