// lib/validation.js
//
// Added for #8: shared, framework-agnostic validation helpers used by the
// register, login, verify-email and reset-password screens. Kept separate
// from components so the rules can be unit tested without rendering React
// (Cornel's test plan, #20).
//
// PR review update: validateConsent removed - the consent checkbox was
// removed from the register screen (see app/register/page.js), so nothing
// calls this anymore.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email || !email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password) {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  return null;
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}

export function validateRequired(value, label) {
  if (!value || !value.trim()) return `${label} is required.`;
  return null;
}

/** Rough password strength meter for the UI hint under the field. */
export function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

/** Maps Firebase Auth (and app-level) error codes to student-facing copy. */
export function mapAuthErrorToMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters, one uppercase letter, one number).";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support if this is a mistake.";
    case "auth/expired-action-code":
      return "This link has expired. Request a new one below.";
    case "auth/invalid-action-code":
      return "This link is invalid or has already been used.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "app/missing-app-url":
      return "The app isn't configured correctly (missing site URL). Please contact support.";
    default:
      return "Something went wrong. Please try again.";
  }
}
