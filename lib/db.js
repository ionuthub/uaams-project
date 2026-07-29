// lib/db.js
// Firestore data model per the ERD (Sprint 1, section 3.2).
//
// Collections:
//   /users               - profile + role ("student" | "admin") + universityId for admins
//   /universities        - seeded reference data
//   /applications        - the core entity; one per student per university
//   /applications/{id}/decisions - subcollection: audit log of every decision (IS-05)
//   /emailLogs           - written by Sorin's email module, one doc per send
//
// Status lifecycle (matches Alina's five status badges):
//   draft -> submitted -> under_review -> offer | rejected
//
// PR note: the temporary demo fallback data that used to live here is gone.
// Every helper now talks to Firestore only and lets failures surface, so the
// UI shows an honest error state instead of sample records.

import {
  collection,
  doc,
  addDoc,
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
 * Create a draft application for the signed-in student.
 * Throws on failure; the apply screen turns that into a visible error.
 */
export async function createApplication(studentUid, universityId, formData) {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "applications"), {
    studentUid,
    universityId,
    status: "draft",
    form: formData,
    documentPath: null,
    documents: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Submit a draft - flips status so it appears in the admin's queue. */
export async function submitApplication(applicationId) {
  const db = getDbClient();
  const applicationRef = doc(db, "applications", applicationId);
  const current = await getDoc(applicationRef);
  if (!current.exists()) throw new Error("APPLICATION_NOT_FOUND");
  // PRD 4.2.3 (#152): passport copy, transcripts and certificates are
  // mandatory; the English test stays optional. Enforced again in rules.
  const docs = current.data().documents || {};
  for (const required of ["passportCopy", "transcripts", "certificates"]) {
    if (!docs[required]?.path) throw new Error("DOCUMENTS_REQUIRED");
  }
  await updateDoc(applicationRef, {
    status: "submitted",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Persist the current form values onto an existing draft.
 * The rules allow-list the form field for the owning student while the
 * application is still a draft, so this keeps saved drafts in sync with what
 * the applicant sees rather than freezing the first-save snapshot.
 */
export async function updateApplicationDraft(applicationId, formData) {
  const db = getDbClient();
  await updateDoc(doc(db, "applications", applicationId), {
    form: formData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Find the student's existing draft for a given university, so the apply
 * screen can reuse it instead of creating a new draft on every visit.
 * Uses two equality filters (no composite index required) and matches the
 * university in memory.
 */
export async function findDraftApplication(studentUid, universityId) {
  const db = getDbClient();
  const q = query(
    collection(db, "applications"),
    where("studentUid", "==", studentUid),
    where("status", "==", "draft")
  );
  const snap = await getDocs(q);
  const match = snap.docs.find((d) => d.data().universityId === universityId);
  return match ? { id: match.id, ...match.data() } : null;
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

/**
 * The most recent draft a student has, across any university, so /apply can
 * resume it on load instead of showing a blank form. Two equality filters
 * keep this index-free; ordering is done in memory.
 */
export async function getLatestDraft(studentUid) {
  const db = getDbClient();
  const q = query(
    collection(db, "applications"),
    where("studentUid", "==", studentUid),
    where("status", "==", "draft")
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const drafts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  drafts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return drafts[0];
}

/* ---------------- Admin side (Ionut's module calls these) ---------------- */

/**
 * Applications scoped to ONE university - the core scoping requirement.
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
 * Move a submitted application to under_review (PRD 4.3.2). The rules
 * allow the scoped admin to write status + updatedAt only; the status-update
 * email is requested separately through the protected server route.
 */
export async function startReview(applicationId) {
  const db = getDbClient();
  await updateDoc(doc(db, "applications", applicationId), {
    status: "under_review",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Record a decision (offer/reject) with a custom message.
 * Writes to BOTH:
 *   1. the application doc (current status - what the student sees)
 *   2. the decisions subcollection (immutable audit log - answers IS-05:
 *      decisions CAN be reversed by making a new decision, but every
 *      decision is logged and nothing is ever overwritten or deleted)
 * Sorin's email module is called after this to send the decision email.
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

/**
 * Delivery record for one decision email, written by the server route.
 * Readable by the scoped admin so the detail view can show send status.
 */
export async function getDecisionEmailLog(applicationId, decisionId) {
  const db = getDbClient();
  const snap = await getDoc(doc(db, "emailLogs", `decision-${applicationId}-${decisionId}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ---------------- Reference data ---------------- */

export async function getUniversities() {
  const db = getDbClient();
  const snap = await getDocs(collection(db, "universities"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
