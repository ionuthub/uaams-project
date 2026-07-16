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
// #18 (verification continuation) and #19 (decision email) reuse sendEmail()
// as their contract in Week 3.

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
 * Send one plain-text email through Resend.
 * @param {{ to: string, subject: string, text: string }} message
 * @returns {Promise<{ providerId: string | null }>} provider message id for emailLogs evidence.
 */
export async function sendEmail({ to, subject, text }) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("EMAIL_FROM");

  if (!to || !subject || !text) {
    const error = new Error("sendEmail requires to, subject and text.");
    error.code = "email/invalid-message";
    throw error;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Resend's error body may describe the failure; never log the key.
    const error = new Error("Email provider rejected the send (HTTP " + response.status + ").");
    error.code = "email/provider-error";
    error.providerStatus = response.status;
    error.providerMessage = data && data.message ? String(data.message) : null;
    throw error;
  }

  return { providerId: data && data.id ? data.id : null };
}

