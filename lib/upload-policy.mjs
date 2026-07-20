export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export function validateUploadFile(file) {
  if (!file) return "NO_FILE";
  if (file.size > MAX_UPLOAD_BYTES) return "FILE_TOO_LARGE";
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return "INVALID_TYPE";
  return null;
}
