export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Accepted MIME types, including the JPEG variants some browsers/OSes emit.
export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/pjpeg", // progressive JPEG (some Windows/older browsers)
  "image/jpg",   // non-standard but emitted by some systems
  "image/png",
];

// Fallback: accepted file extensions, for when the browser reports an
// empty or unexpected MIME type (happens on some OS/browser combinations).
export const ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

export function validateUploadFile(file) {
  if (!file) return "NO_FILE";
  if (file.size > MAX_UPLOAD_BYTES) return "FILE_TOO_LARGE";

  const typeOk = ALLOWED_UPLOAD_TYPES.includes((file.type || "").toLowerCase());
  const name = (file.name || "").toLowerCase();
  const extOk = ALLOWED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext));

  // Accept if EITHER the MIME type or the extension is valid — this rescues
  // correctly-named files that the browser mislabels, without opening the door
  // to arbitrary types (the storage rules still enforce contentType server-side).
  if (!typeOk && !extOk) return "INVALID_TYPE";
  return null;
}
