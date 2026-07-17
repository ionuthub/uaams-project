// lib/email.js
// Server-only email sender using Resend's REST API (issue #17, US-10 / EP-08).
// Selected provider: Resend (docs/email-provider-decision.md).
//
// Design rules (docs/architecture-overview.md, Email Flow):
// - server-side only: RESEND_API_KEY must never carry the NEXT_PUBLIC_ prefix
//   and this module must never be imported from a client component;
// - callers must never trust a browser-supplied recipient/decision/message;
// - errors are safe to log: no secrets, no email bodies.
//
// Uses fetch against the Resend REST API so no new dependency is added.
// Decision and controlled test routes share sendEmail() as their provider
// boundary.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(name + " is not configured on the server.");
    error.code = "email/missing-config";
    throw error;
  }
  return value;
}

/**
 * Send one email through Resend.
 * @param {{ to: string, subject: string, text: string, html?: string, idempotencyKey?: string }} message
 * @returns {Promise<{ providerId: string | null }>} provider message id for emailLogs evidence.
 */
export async function sendEmail({ to, subject, text, html, idempotencyKey }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("EMAIL_FROM");

  if (!to || !subject || !text) {
    const error = new Error("sendEmail requires to, subject and text.");
    error.code = "email/invalid-message";
    throw error;
  }
  if (idempotencyKey && (idempotencyKey.length > 256 || /\s/.test(idempotencyKey))) {
    const error = new Error("The email idempotency key is invalid.");
    error.code = "email/invalid-idempotency-key";
    throw error;
  }

  const headers = {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ from, to, subject, text, ...(html ? { html } : {}) }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Resend's error body may describe the failure; never log the key.
    const error = new Error("Email provider rejected the send (HTTP " + response.status + ").");
    error.code = "email/provider-error";
    error.providerStatus = response.status;
    error.providerCode = data && data.name ? String(data.name) : null;
    throw error;
  }

  return { providerId: data && data.id ? data.id : null };
}
