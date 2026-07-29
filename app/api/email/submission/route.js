// app/api/email/submission/route.js
// Sends the application submission confirmation email (PRD section 5).
// Modelled on the decision email route: same bearer-token verification,
// the same emailLogs record, and the same send lease so a retry or a
// double-submit produces one email, not two. The submission itself is
// already committed before this route is called; a failure here is
// logged and reported honestly but never un-submits the application.

import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";
import { getBearerToken } from "../../../../lib/decision-email.mjs";
import { sendEmail } from "../../../../lib/email";

const ACTIVE_SEND_LEASE_MS = 2 * 60 * 1000;

function fail(status, code) {
  return NextResponse.json({ ok: false, code }, { status });
}

function buildSubmissionEmail({ universityName, courseName, applicationId }) {
  const subject = "Your UAAMS application has been received";
  const course = courseName ? ` for ${courseName}` : "";
  const text =
    `Your application${course} to ${universityName} has been received.\n\n` +
    `Application reference: ${applicationId}\n\n` +
    `You can follow its progress from your dashboard at any time. ` +
    `We will email you again when a decision is made.`;
  const html =
    `<p>Your application${course} to <strong>${universityName}</strong> has been received.</p>` +
    `<p>Application reference: <strong>${applicationId}</strong></p>` +
    `<p>You can follow its progress from your dashboard at any time. ` +
    `We will email you again when a decision is made.</p>`;
  return { subject, text, html };
}

async function claimSubmissionLog(db, key, recipient) {
  const ref = db.collection("emailLogs").doc(key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = snap.data();
      if (data.status === "sent") return { claimed: false, reason: "already-sent" };
      if (
        data.status === "sending" &&
        data.claimedAt &&
        Date.now() - data.claimedAt.toMillis() < ACTIVE_SEND_LEASE_MS
      ) {
        return { claimed: false, reason: "in-progress" };
      }
    }
    tx.set(ref, {
      eventType: "submission-confirmation",
      recipient,
      status: "sending",
      claimedAt: Timestamp.now(),
      attempts: FieldValue.increment(1),
    }, { merge: true });
    return { claimed: true };
  });
}

export async function POST(request) {
  let auth, db;
  try {
    auth = getAdminAuth();
    db = getAdminDb();
  } catch {
    return fail(500, "server/configuration-error");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "request/invalid-json");
  }
  const applicationId = typeof body?.applicationId === "string" ? body.applicationId.trim() : "";
  if (!applicationId) return fail(400, "request/invalid-body");

  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) return fail(401, "auth/missing-token");

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return fail(401, "auth/invalid-token");
  }
  if (decoded.email_verified !== true) return fail(403, "auth/email-not-verified");

  const appSnap = await db.collection("applications").doc(applicationId).get();
  if (!appSnap.exists) return fail(404, "application/not-found");
  const application = appSnap.data();
  if (application.studentUid !== decoded.uid) return fail(403, "application/not-owner");
  if (application.status !== "submitted") return fail(409, "application/not-submitted");

  const recipient = decoded.email;
  if (!recipient) return fail(422, "application/student-email-unavailable");

  const key = `submission-${applicationId}`;
  const claim = await claimSubmissionLog(db, key, recipient);
  if (!claim.claimed) {
    return NextResponse.json({ ok: true, code: `email/${claim.reason}` });
  }

  const { subject, text, html } = buildSubmissionEmail({
    universityName: application.form?.universityName || application.universityId,
    courseName: application.form?.courseName || "",
    applicationId,
  });

  const logRef = db.collection("emailLogs").doc(key);
  try {
    const result = await sendEmail({ to: recipient, subject, text, html, idempotencyKey: key });
    await logRef.set({
      status: "sent",
      providerId: result?.id || null,
      sentAt: Timestamp.now(),
    }, { merge: true });
    return NextResponse.json({ ok: true, code: "email/sent" });
  } catch (error) {
    await logRef.set({
      status: "failed",
      failedAt: Timestamp.now(),
      errorCode: error?.code || error?.message || "unknown",
    }, { merge: true }).catch(() => {});
    return fail(502, "email/provider-error");
  }
}
