// Explicit local-only integration run; never connect these fixtures to production.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { ensureApplicationReference } from "../lib/application-reference-server.mjs";

if (!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || "")) {
  throw new Error("Run only with FIRESTORE_EMULATOR_HOST=127.0.0.1:<port>.");
}
const projectId = "demo-uaams-references";
const app = initializeApp({ projectId });
const db = getFirestore(app);
let env;
const owner = { uid: "existing-test-applicant", email_verified: true };
const universityAdmin = { uid: "existing-test-admin", email_verified: true };
const submittedAt = Timestamp.fromDate(new Date("2026-08-10T14:25:00Z"));
const fixture = (overrides = {}) => ({
  studentUid: owner.uid, universityId: "solent", status: "submitted",
  form: { fullName: "Playwright Test Student" }, submittedAt, createdAt: submittedAt, updatedAt: submittedAt,
  documents: { transcripts: { path: "test/transcript.pdf" } }, ...overrides,
});
before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile("firestore.rules", "utf8") } });
  await env.clearFirestore();
  await db.doc(`users/${universityAdmin.uid}`).set({ role: "admin", universityId: "solent" });
  await db.doc("users/other-admin").set({ role: "admin", universityId: "portsmouth" });
});
after(async () => { await env?.cleanup(); await deleteApp(app); });

test("concurrent applications and repeated requests allocate unique permanent numbers", async () => {
  const ids = Array.from({ length: 6 }, (_, i) => `concurrent-${i}`);
  await Promise.all(ids.map((id) => db.doc(`applications/${id}`).set(fixture())));
  const references = await Promise.all(ids.map((id) => ensureApplicationReference(db, id, owner)));
  assert.equal(new Set(references).size, ids.length);
  assert.ok(references.every((ref) => /^APP-2026-\d{5}$/.test(ref)));
  const repeated = await Promise.all(Array.from({ length: 5 }, () => ensureApplicationReference(db, ids[0], owner)));
  assert.ok(repeated.every((ref) => ref === references[0]));
  assert.equal(await ensureApplicationReference(db, ids[0], universityAdmin), references[0]);
  const after = (await db.doc(`applications/${ids[0]}`).get()).data();
  const { referenceNumber, ...unchanged } = after;
  assert.deepEqual(unchanged, fixture());
  assert.equal((await db.doc("applicationReferenceCounters/2026").get()).data().lastSequence, 6);
});

test("same unnumbered application requested concurrently consumes one sequence", async () => {
  await db.doc("applications/same-record").set(fixture());
  const refs = await Promise.all(Array.from({ length: 5 }, () => ensureApplicationReference(db, "same-record", owner)));
  assert.equal(new Set(refs).size, 1);
  assert.equal((await db.doc("applicationReferenceCounters/2026").get()).data().lastSequence, 7);
});

test("legacy records use the submission year and separate annual sequence", async () => {
  await db.doc("applications/legacy").set(fixture({ submittedAt: Timestamp.fromDate(new Date("2025-12-31T23:59:00Z")) }));
  assert.equal(await ensureApplicationReference(db, "legacy", owner), "APP-2025-00001");
  await db.doc("applications/draft").set(fixture({ status: "draft", submittedAt: null }));
  assert.match(await ensureApplicationReference(db, "draft", owner), /^APP-2026-/);
});

test("other students, other universities and unverified users cannot allocate or read references", async () => {
  for (const actor of [{ uid: "other-student", email_verified: true }, { uid: "other-admin", email_verified: true }, { uid: owner.uid, email_verified: false }]) {
    await assert.rejects(ensureApplicationReference(db, "legacy", actor), (error) => [403, 404].includes(error.status));
  }
  await assert.rejects(ensureApplicationReference(db, "missing-record", owner), { status: 404 });
});

test("rules protect reference fields, counters and reservations while allowing ordinary updates", async () => {
  const student = env.authenticatedContext(owner.uid, { email_verified: true }).firestore();
  const admin = env.authenticatedContext(universityAdmin.uid, { email_verified: true }).firestore();
  await assertSucceeds(getDoc(doc(student, "applications/legacy")));
  await assertSucceeds(getDoc(doc(admin, "applications/legacy")));
  for (const client of [student, admin]) {
    await assertFails(updateDoc(doc(client, "applications/legacy"), { referenceNumber: "APP-2025-99999" }));
    await assertFails(setDoc(doc(client, "applicationReferenceCounters/2025"), { lastSequence: 0 }));
    await assertFails(getDoc(doc(client, "applicationReferences/APP-2025-00001")));
  }
  await assertFails(setDoc(doc(student, "applications/spoof"), fixture({ status: "draft", referenceNumber: "APP-2026-99999", submittedAt: submittedAt.toDate(), createdAt: submittedAt.toDate(), updatedAt: submittedAt.toDate() })));
  await assertSucceeds(updateDoc(doc(admin, "applications/legacy"), { status: "under_review", updatedAt: submittedAt.toDate() }));
  await assertSucceeds(updateDoc(doc(student, "applications/draft"), { form: { fullName: "Playwright Test Student" }, updatedAt: submittedAt.toDate() }));
});

test("a damaged counter fails closed rather than reusing an assigned number", async () => {
  await db.doc("applicationReferenceCounters/2025").set({ lastSequence: 0 });
  await db.doc("applications/collision").set(fixture({ submittedAt: Timestamp.fromDate(new Date("2025-08-01T00:00:00Z")) }));
  await assert.rejects(ensureApplicationReference(db, "collision", owner), { code: "reference/counter-conflict" });
  assert.equal((await db.doc("applications/collision").get()).data().referenceNumber, undefined);
});
