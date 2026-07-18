// lib/documents.js
// v2 Phase 1: documents as first-class records (multi-upload per application).
// Replaces the single documentPath pattern over Sprint 3; documentPath stays
// for backward compatibility until Elena's screens switch over.
import {
  collection, doc, addDoc, getDocs, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { getDbClient, getStorageClient } from "./firebase";

const MAX_BYTES = 10 * 1024 * 1024; // IS-07
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function validateFile(file) {
  if (!file) return "NO_FILE";
  if (file.size > MAX_BYTES) return "FILE_TOO_LARGE";
  if (!ALLOWED_TYPES.includes(file.type)) return "INVALID_TYPE";
  return null;
}

/** Upload a file and create its document record with denormalized fields for rule scoping. */
export async function addDocumentToApplication(applicationId, universityId, studentUid, file) {
  const problem = validateFile(file);
  if (problem) throw new Error(problem);
  
  const storage = getStorageClient();
  const db = getDbClient();
  
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `applications/${applicationId}/${Date.now()}_${safeName}`;
  
  // Upload to Cloud Storage
  await uploadBytes(ref(storage, path), file, { contentType: file.type });
  
  // Create first-class record in the top-level 'documents' collection
  const docRef = await addDoc(collection(db, "documents"), {
    applicationId,
    universityId,          // Denormalized for query-provable rules
    uploadedBy: studentUid, // Denormalized for query-provable rules
    fileName: file.name,
    storagePath: path,
    contentType: file.type,
    size: file.size,
    status: "received",     // v2: requested | received | verified
    uploadedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

/** All document records for one application, scoped by student for rule validation. */
export async function getDocumentsForApplication(applicationId, studentUid) {
  const db = getDbClient();
  
  // The where("uploadedBy") constraint satisfies the rule engine filter requirement
  const snap = await getDocs(query(
    collection(db, "documents"),
    where("applicationId", "==", applicationId),
    where("uploadedBy", "==", studentUid),
    orderBy("uploadedAt", "desc")
  ));
  
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}