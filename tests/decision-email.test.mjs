import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDecisionEmail,
  decisionEmailIdempotencyKey,
  getBearerToken,
} from "../lib/decision-email.mjs";

test("builds an offer email in text and HTML", () => {
  const result = buildDecisionEmail({
    decision: "offer",
    message: "Congratulations <Student> & welcome.",
  });

  assert.match(result.subject, /offer/i);
  assert.match(result.text, /Congratulations <Student> & welcome\./);
  assert.match(result.html, /Congratulations &lt;Student&gt; &amp; welcome\./);
});

test("builds a rejection email without claiming an offer", () => {
  const result = buildDecisionEmail({
    decision: "rejected",
    message: "Thank you for applying.",
  });

  assert.match(result.text, /unsuccessful/i);
  assert.doesNotMatch(result.subject, /offer/i);
});

test("rejects invalid decision content", () => {
  assert.throws(
    () => buildDecisionEmail({ decision: "pending", message: "Message" }),
    /INVALID_DECISION/
  );
  assert.throws(
    () => buildDecisionEmail({ decision: "offer", message: "   " }),
    /EMPTY_DECISION_MESSAGE/
  );
});

test("extracts only a valid bearer token", () => {
  assert.equal(getBearerToken("Bearer token-value"), "token-value");
  assert.equal(getBearerToken("Basic token-value"), null);
  assert.equal(getBearerToken(null), null);
});

test("uses the committed decision identity for the idempotency key", () => {
  assert.equal(
    decisionEmailIdempotencyKey("application-1", "decision-2"),
    "decision-email/application-1/decision-2"
  );
});
