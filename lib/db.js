// lib/db.js
// Firestore data model per the ERD (Sprint 1, section 3.2).
//
// Collections:
//   /users                 - profile + role ("student" | "admin") + universityId for admins
//   /universities          - seeded reference data
//   /applications          - the core entity; one per student per university
//   /applications/{id}/decisions - subcollection: audit log of every decision (IS-05)
//   /applications/{id}/notes     - subcollection: internal admin notes (PRD 4.3.2)
//   /emailLogs           - written by Sorin's email module, one doc per send
//
// Status lifecycle (matches Alina's status badges):
//   draft -> submitted -> under_review -> offer | rejected | withdrawn

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteField,
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

/* ---------------- User Profile helpers ---------------- */

/** Fetch user profile including role ("student" | "admin") and universityId. */
export async function getUserProfile(uid) {
  const db = getDbClient();
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Create or update a user profile. */
export async function setUserProfile(uid, profileData) {
  const db = getDbClient();
  await setDoc(
    doc(db, "users", uid),
    {
      ...profileData,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

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
 * Withdraw an active (submitted or under_review) application (PRD #194).
 * Enforced by security rules to ensure non-terminal states only.
 */
export async function withdrawApplication(applicationId) {
  const db = getDbClient();
  const applicationRef = doc(db, "applications", applicationId);
  const current = await getDoc(applicationRef);
  if (!current.exists()) throw new Error("APPLICATION_NOT_FOUND");

  const currentStatus = current.data().status;
  if (!["submitted", "under_review"].includes(currentStatus)) {
    throw new Error("CANNOT_WITHDRAW_TERMINAL_APPLICATION");
  }

  await updateDoc(applicationRef, {
    status: "withdrawn",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Persist the current form values onto an existing draft.
 */
export async function updateApplicationDraft(applicationId, formData) {
  const db = getDbClient();
  await updateDoc(doc(db, "applications", applicationId), {
    form: formData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Find the student's existing draft for a given university.
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
 * The most recent draft a student has, across any university.
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

/* ---------------- Document Management ---------------- */

/** Attach or update document metadata on a draft application. */
export async function updateApplicationDocument(applicationId, docKey, docData) {
  const db = getDbClient();
  const appRef = doc(db, "applications", applicationId);
  await updateDoc(appRef, {
    [`documents.${docKey}`]: docData,
    updatedAt: serverTimestamp(),
  });
}

/** Remove an attached document from a draft application. */
export async function removeApplicationDocument(applicationId, docKey) {
  const db = getDbClient();
  const appRef = doc(db, "applications", applicationId);
  await updateDoc(appRef, {
    [`documents.${docKey}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

/* ---------------- Admin side ---------------- */

/** Applications scoped to ONE university. */
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

/** Move a submitted application to under_review (PRD 4.3.2). */
export async function startReview(applicationId) {
  const db = getDbClient();
  await updateDoc(doc(db, "applications", applicationId), {
    status: "under_review",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Record a decision (offer/reject) with a custom message.
 * Writes to BOTH application doc and decisions subcollection (IS-05).
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

/* ---------------- Email Logs ---------------- */

/** Record or update email delivery log. */
export async function writeEmailLog(logId, logData) {
  const db = getDbClient();
  await setDoc(doc(db, "emailLogs", logId), {
    ...logData,
    sentAt: serverTimestamp(),
  });
}

/** Delivery record for one decision email. */
export async function getDecisionEmailLog(applicationId, decisionId) {
  const db = getDbClient();
  const snap = await getDoc(doc(db, "emailLogs", `decision-${applicationId}-${decisionId}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ---------------- Internal Notes (Admin) ---------------- */

/** 
 * Add an internal note to an application (PRD 4.3.2). 
 * Scoped-admin only - enforced by security rules.
 */
export async function addInternalNote(applicationId, universityId, adminUid, adminName, body) {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "applications", applicationId, "notes"), {
    body,
    authorUid: adminUid,
    authorName: adminName,
    universityId, // denormalised for rule scoping
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

/* ---------------- In-app notifications (PRD 4.2.2, #164) ---------------- */

/** The signed-in student's notifications, newest first. */
export async function getNotifications(userId) {
  const db = getDbClient();
  const q = query(collection(db, "notifications"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return items;
}

/** Mark one notification as read. */
export async function markNotificationRead(notificationId) {
  const db = getDbClient();
  await updateDoc(doc(db, "notifications", notificationId), { readStatus: true });
}

/* ---------------- Reference data ---------------- */

export async function getUniversities() {
  const db = getDbClient();
  const snap = await getDocs(collection(db, "universities"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}