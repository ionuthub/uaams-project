// lib/storage.js
// Document upload with validation.
// Implements the IS-07 team standard: max 10 MB; PDF, JPG, PNG only.
// Validation is enforced twice: here (friendly errors for Elena's UI)
// and in storage.rules (server-side, cannot be bypassed).
//
// IS-04 note (signed vs secured URLs): this scaffold uses getDownloadURL,
// which returns a tokenised URL — anyone with the link can open the file.
// The more secure option for Sprint 3 is to keep files private and only
// allow reads through the storage rules (admin of that university, or the
// owning student). Rules-based access is already written in storage.rules,
// so the decision for IS-04 is: prefer rules-scoped access; only fall back
// to download URLs if the front end needs a plain <a href>.

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getStorageClient, getDbClient } from "./firebase";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (IS-07)
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** Client-side validation — returns null if OK, or an error code string. */
export function validateFile(file) {
  if (!file) return "NO_FILE";
  if (file.size > MAX_BYTES) return "FILE_TOO_LARGE";
  if (!ALLOWED_TYPES.includes(file.type)) return "INVALID_TYPE";
  return null;
}

/**
 * Upload a supporting document for an application and link it on the
 * application doc. Path pattern: applications/{applicationId}/{filename}
 * — the path embeds the applicationId so storage rules can check ownership.
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

/**
 * Get a viewable URL for a stored document.
 * Works only if the caller passes the storage rules (owner or scoped admin).
 */
export async function getDocumentUrl(path) {
  const storage = getStorageClient();
  return getDownloadURL(ref(storage, path));
}
