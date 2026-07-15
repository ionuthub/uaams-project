// lib/db.js
// Firestore data model per the ERD (Sprint 1, section 3.2).
//
// Collections:
//   /users               — profile + role ("student" | "admin") + universityId for admins
//   /universities        — seeded reference data
//   /applications        — the core entity; one per student per university
//   /applications/{id}/decisions — subcollection: audit log of every decision (IS-05)
//   /emailLogs           — written by Sorin's email module, one doc per send
//
// Status lifecycle (matches Alina's five status badges):
//   draft -> submitted -> under_review -> offer | rejected

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getDbClient } from "./firebase";

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "offer",
  "rejected",
];

/* ---------------- Student side ---------------- */

/**
 * Create (or return existing) draft application for the signed-in student.
 */
export async function createApplication(studentUid, universityId, formData) {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "applications"), {
    studentUid,
    universityId,
    status: "draft",
    form: formData,           // step 1 + step 4 fields from Alina's form skeleton
    documentPath: null,       // set by uploadDocument (lib/storage.js)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Submit a draft — flips status so it appears in the admin's queue. */
export async function submitApplication(applicationId) {
  const db = getDbClient();
  await updateDoc(doc(db, "applications", applicationId), {
    status: "submitted",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** All applications belonging to one student (dashboard view). */
export async function getStudentApplications(studentUid) {
  const db = getDbClient();
  const q = query(
    collection(db, "applications"),
    where("studentUid", "==", studentUid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------- Admin side (Ionut's module calls these) ---------------- */

/**
 * Applications scoped to ONE university — the core scoping requirement.
 * The security rules enforce this server-side too; this is just the query.
 */
export async function getApplicationsForUniversity(universityId) {
  const db = getDbClient();
  const q = query(
    collection(db, "applications"),
    where("universityId", "==", universityId),
    where("status", "in", ["submitted", "under_review", "offer", "rejected"]),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Single application detail view. */
export async function getApplication(applicationId) {
  const db = getDbClient();
  const snap = await getDoc(doc(db, "applications", applicationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Record a decision (offer/reject) with a custom message.
 * Writes to BOTH:
 *   1. the application doc (current status — what the student sees)
 *   2. the decisions subcollection (immutable audit log — answers IS-05:
 *      decisions CAN be reversed by making a new decision, but every
 *      decision is logged and nothing is ever overwritten or deleted)
 * Sorin's email module listens for / is called after this to send the email.
 */
export async function recordDecision(applicationId, adminUid, decision, message) {
  if (!["offer", "rejected"].includes(decision)) {
    throw new Error("INVALID_DECISION");
  }
  const db = getDbClient();
  const batch = writeBatch(db);
  const decisionRef = doc(collection(db, "applications", applicationId, "decisions"));
  batch.set(decisionRef, {
    decision,
    message,
    decidedBy: adminUid,
    decidedAt: serverTimestamp(),
  });
  batch.update(doc(db, "applications", applicationId), {
    status: decision,
    latestDecisionMessage: message,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** Full decision history for one application (evidence for IS-05). */
export async function getDecisionHistory(applicationId) {
  const db = getDbClient();
  const q = query(
    collection(db, "applications", applicationId, "decisions"),
    orderBy("decidedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------- Reference data ---------------- */

export async function getUniversities() {
  const db = getDbClient();
  const snap = await getDocs(collection(db, "universities"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
