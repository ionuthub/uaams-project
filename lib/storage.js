// lib/storage.js
// Document upload with validation.
// Implements the IS-07 team standard: max 10 MB; PDF, JPG, PNG only.
// Validation is enforced twice: here (friendly errors for Alina's UI)
// and in storage.rules (server-side, cannot be bypassed).
//
// IS-04 note (signed vs secured URLs): this scaffold uses getDownloadURL,
// which returns a tokenised URL - anyone with the link can open the file.
// The more secure option for Sprint 3 is to keep files private and only
// allow reads through the storage rules (admin of that university, or the
// owning student). Rules-based access is already written in storage.rules,
// so the decision for IS-04 is: prefer rules-scoped access; only fall back
// to download URLs if the front end needs a plain <a href>.

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getStorageClient, getDbClient } from "./firebase";
import { validateUploadFile } from "./upload-policy.mjs";

/** Client-side validation - returns null if OK, or an error code string. */
export function validateFile(file) {
  return validateUploadFile(file);
}

/**
 * Upload a supporting document for an application and link it on the
 * application doc. Path pattern: applications/{applicationId}/{filename}
 * - the path embeds the applicationId so storage rules can check ownership.
 */
export async function uploadDocument(applicationId, file) {
  const problem = validateFile(file);
  if (problem) throw new Error(problem);

  const storage = getStorageClient();
  const db = getDbClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `applications/${applicationId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType: file.type });

  await updateDoc(doc(db, "applications", applicationId), {
    documentPath: path,
    updatedAt: serverTimestamp(),
  });

  return path;
}

// PRD 4.2.3 document types (issue #152). The storage rules match the flat
// path applications/{applicationId}/{fileName}, so the type is encoded in
// the file name prefix instead of a sub-folder - no storage.rules change.
export const DOC_TYPES = [
  ["passportCopy", "Passport copy", true],
  ["transcripts", "Academic transcripts", true],
  ["certificates", "Certificates", true],
  ["englishTest", "English language test", false],
];

/**
 * Upload one typed document and record it under documents.{docType} on the
 * application. documentPath is also set (most recent upload) so older
 * records and views keep working.
 */
export async function uploadTypedDocument(applicationId, docType, file) {
  if (!DOC_TYPES.some(([key]) => key === docType)) throw new Error("INVALID_DOC_TYPE");
  const problem = validateFile(file);
  if (problem) throw new Error(problem);

  const storage = getStorageClient();
  const db = getDbClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `applications/${applicationId}/${docType}__${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType: file.type });

  await updateDoc(doc(db, "applications", applicationId), {
    [`documents.${docType}`]: { path, name: safeName, uploadedAt: serverTimestamp() },
    documentPath: path,
    updatedAt: serverTimestamp(),
  });

  return path;
}

/**
 * Get a viewable URL for a stored document.
 * Works only if the caller passes the storage rules (owner or scoped admin).
 */
export async function getDocumentUrl(path) {
  const storage = getStorageClient();
  return getDownloadURL(ref(storage, path));
}
