// lib/db.js
// Firestore data model per the ERD (Sprint 1, section 3.2).
//
// Collections:
//   /users               - profile + role ("student" | "admin") + universityId for admins
//   /universities        - seeded reference data
//   /applications        - the core entity; one per student per university
//   /applications/{id}/decisions - subcollection: audit log of every decision (IS-05)
//   /applications/{id}/notes     - subcollection: internal admin notes (PRD 4.3.2)
//   /emailLogs           - written by Sorin's email module, one doc per send
//
// Status lifecycle (matches Alina's five status badges):
//   draft -> submitted -> under_review -> offer | rejected
//   submitted | under_review -> withdrawn  (terminal, student-initiated, #194)
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
  "withdrawn",
];

/**
 * Statuses a student may withdraw FROM (#194).
 * A draft is not included: a draft was never submitted, so there is nothing to
 * withdraw. A decided application is not included either - once a university
 * has answered, withdrawing would rewrite the end of a record we deliberately
 * keep append-only.
 */
export const WITHDRAWABLE_STATUSES = ["submitted", "under_review"];

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
    // #194: withdrawn is included so staff can see that an applicant pulled out,
    // rather than the application silently vanishing from a queue they may have
    // been part-way through reviewing. It is filterable and counted separately,
    // and the detail view offers no actions on it.
    where("status", "in", ["submitted", "under_review", "offer", "rejected", "withdrawn"]),
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
  // A decision goes into an append-only log and is emailed to the applicant.
  // It can never be corrected afterwards, only superseded by a new decision,
  // so a blank or oversized message is refused here as well as in the rules.
  // Silvana's finding (#190): this previously accepted an empty message.
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  if (!trimmedMessage) throw new Error("DECISION_MESSAGE_REQUIRED");
  if (trimmedMessage.length > 2000) throw new Error("DECISION_MESSAGE_TOO_LONG");
  const db = getDbClient();
  const batch = writeBatch(db);
  const decisionRef = doc(collection(db, "applications", applicationId, "decisions"));
  batch.set(decisionRef, {
    decision,
    message: trimmedMessage,
    decidedBy: adminUid,
    decidedAt: serverTimestamp(),
  });
  batch.update(doc(db, "applications", applicationId), {
    status: decision,
    latestDecisionMessage: trimmedMessage,
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

/* ---------------- In-app notifications (PRD 4.2.2, #164) ---------------- */

/**
 * The signed-in student's notifications, newest first. Single equality
 * filter (no composite index needed); ordering is done in memory.
 */
export async function getNotifications(userId) {
  const db = getDbClient();
  const q = query(collection(db, "notifications"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return items;
}

/** Mark one notification as read. Rules only allow readStatus -> true. */
export async function markNotificationRead(notificationId) {
  const db = getDbClient();
  await updateDoc(doc(db, "notifications", notificationId), { readStatus: true });
}

/**
 * Withdraw a submitted application (#194, supervisor checkpoint action 3).
 *
 * The application is NOT deleted. Nothing in this system is - see #193. The
 * status moves to a terminal "withdrawn" and the record stays intact, which is
 * the same reasoning behind the append-only decision history: we keep what
 * happened rather than erasing it.
 *
 * Guarded here AND in firestore.rules. This check gives a useful error; the
 * rule is what actually stops it, because this function runs in the browser
 * and can be bypassed.
 */
export async function withdrawApplication(applicationId) {
  const db = getDbClient();
  const ref = doc(db, "applications", applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("APPLICATION_NOT_FOUND");

  const status = snap.data().status;
  if (status === "withdrawn") throw new Error("ALREADY_WITHDRAWN");
  if (!WITHDRAWABLE_STATUSES.includes(status)) throw new Error("NOT_WITHDRAWABLE");

  await updateDoc(ref, {
    status: "withdrawn",
    withdrawnAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ---------------- Internal notes (admin only) ---------------- */

/**
 * Add an internal note to an application (PRD 4.3.2).
 * Scoped-admin only - the rules enforce that, not this function.
 * universityId is denormalised onto the note for the same reason it is on the
 * application: rules evaluate one document at a time, so a parent lookup would
 * cost an extra read on every check.
 */
export async function addInternalNote(applicationId, universityId, adminUid, adminName, body) {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "applications", applicationId, "notes"), {
    body,
    authorUid: adminUid,
    authorName: adminName,
    universityId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** List internal notes for an application, newest first. Scoped-admin only. */
export async function getInternalNotes(applicationId) {
  const db = getDbClient();
  const snap = await getDocs(
    query(
      collection(db, "applications", applicationId, "notes"),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------- Reference data ---------------- */

export async function getUniversities() {
  const db = getDbClient();
  const snap = await getDocs(collection(db, "universities"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
