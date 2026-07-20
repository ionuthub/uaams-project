const DECISIONS = new Set(["offer", "rejected"]);

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildDecisionEmail({ decision, message }) {
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (!DECISIONS.has(decision)) {
    throw new Error("INVALID_DECISION");
  }
  if (!cleanMessage) {
    throw new Error("EMPTY_DECISION_MESSAGE");
  }

  const isOffer = decision === "offer";
  const subject = isOffer
    ? "Your UAAMS application: offer"
    : "Your UAAMS application update";
  const summary = isOffer
    ? "Your application has received an offer."
    : "Your application has been unsuccessful.";
  const text = [
    "Hello,",
    "",
    summary,
    "",
    "Message from the university:",
    cleanMessage,
    "",
    "You can sign in to UAAMS to view your current application status.",
  ].join("\n");
  const htmlMessage = escapeHtml(cleanMessage).replaceAll("\n", "<br>");
  const html = [
    "<p>Hello,</p>",
    `<p>${summary}</p>`,
    "<p><strong>Message from the university:</strong></p>",
    `<p>${htmlMessage}</p>`,
    "<p>You can sign in to UAAMS to view your current application status.</p>",
  ].join("");

  return { subject, text, html };
}

export function getBearerToken(headerValue) {
  if (typeof headerValue !== "string") return null;
  const match = headerValue.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

export function decisionEmailIdempotencyKey(applicationId, decisionId) {
  return `decision-email/${applicationId}/${decisionId}`;
}
