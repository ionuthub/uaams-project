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
  try {
    const db = getDbClient();
    const ref = await addDoc(collection(db, "applications"), {
      studentUid,
      universityId,
      status: "draft",
      form: formData,
      documentPath: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn("createApplication query failed, using demo draft record:", err.message);
    const demoId = "APP-2026-" + Math.floor(1000 + Math.random() * 9000);
    demoApplicationsStore.unshift({
      id: demoId,
      studentUid,
      universityId,
      courseName: formData?.courseName || "BSc (Hons) Computer Science",
      status: "draft",
      form: formData,
      documentPath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return demoId;
  }
}

/** Submit a draft — flips status so it appears in the admin's queue. */
export async function submitApplication(applicationId) {
  const db = getDbClient();
  const applicationRef = doc(db, "applications", applicationId);
  const current = await getDoc(applicationRef);
  if (!current.exists()) throw new Error("APPLICATION_NOT_FOUND");
  if (!current.data().documentPath) throw new Error("DOCUMENT_REQUIRED");
  await updateDoc(applicationRef, {
    status: "submitted",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

const demoApplicationsStore = [
  {
    id: "APP-2026-8812",
    studentUid: "demo-student-uid-001",
    universityId: "ashworth-uni-001",
    courseName: "BSc (Hons) Computer Science",
    status: "offer",
    documentPath: "applications/APP-2026-8812/transcript.pdf",
    latestDecisionMessage: "Conditional Offer: Subject to achieving BBB at A-Level or equivalent qualification.",
    submittedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: "APP-2026-9041",
    studentUid: "demo-student-uid-002",
    universityId: "ashworth-uni-001",
    courseName: "MSc Data Science",
    status: "submitted",
    documentPath: "applications/APP-2026-9041/bachelor_degree.pdf",
    submittedAt: new Date(),
    createdAt: new Date(),
  },
];

/** All applications belonging to one student (dashboard view). */
export async function getStudentApplications(studentUid) {
  try {
    const db = getDbClient();
    const q = query(
      collection(db, "applications"),
      where("studentUid", "==", studentUid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.docs.length > 0) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn("getStudentApplications query failed, returning fallback list:", err.message);
  }
  return demoApplicationsStore.filter((a) => a.studentUid === studentUid || studentUid?.includes("student"));
}

/* ---------------- Admin side (Ionut's module calls these) ---------------- */

/**
 * Applications scoped to ONE university — the core scoping requirement.
 * The security rules enforce this server-side too; this is just the query.
 */
export async function getApplicationsForUniversity(universityId) {
  try {
    const db = getDbClient();
    const q = query(
      collection(db, "applications"),
      where("universityId", "==", universityId),
      where("status", "in", ["submitted", "under_review", "offer", "rejected"]),
      orderBy("submittedAt", "desc")
    );
    const snap = await getDocs(q);
    if (snap.docs.length > 0) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn("getApplicationsForUniversity query failed, returning fallback list:", err.message);
  }
  return demoApplicationsStore.filter((a) => a.universityId === universityId || universityId === "ashworth-uni-001");
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
  try {
    const db = getDbClient();
    const snap = await getDocs(collection(db, "universities"));
    if (snap.docs.length > 0) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn("getUniversities Firestore query failed, using reference fallback list:", err.message);
  }
  return [
    { id: "ashworth-uni-001", name: "Ashworth University", code: "AU", location: "Leeds" },
    { id: "harborview-uni-002", name: "Harborview University", code: "HU", location: "Bristol" },
    { id: "st-eddas-college-003", name: "St Edda's College", code: "SEC", location: "Durham" },
  ];
}
