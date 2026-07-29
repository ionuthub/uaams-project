// app/api/email/status/route.js
// Status-update email (PRD 5, issue #165): when an admissions officer moves
// an application to Under review, the student is told by email. Mirrors the
// decision route's guards and emailLogs idempotency exactly; one log per
// application per status so admin retries can never double-send.

import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";
import { getBearerToken } from "../../../../lib/decision-email.mjs";
import { sendEmail } from "../../../../lib/email";

export const runtime = "nodejs";

const ACTIVE_SEND_LEASE_MS = 2 * 60 * 1000;

function errorResponse(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

function safeErrorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^[a-z0-9/_-]+$/i.test(code) ? code : "email/send-failed";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildStatusEmail(universityName) {
  const uni = universityName || "your chosen university";
  const subject = "Your application is now under review";
  const text = [
    "Hello,",
    "",
    `Good news: ${uni} has started reviewing your application.`,
    "You do not need to do anything right now. We will email you again as soon as a decision is made.",
    "",
    "You can follow progress any time from your dashboard: https://www.uaams.website/student",
    "",
    "UAAMS team",
  ].join("\n");
  const html = `<p>Hello,</p><p>Good news: <strong>${escapeHtml(uni)}</strong> has started reviewing your application.</p><p>You do not need to do anything right now. We will email you again as soon as a decision is made.</p><p>You can follow progress any time from <a href="https://www.uaams.website/student">your dashboard</a>.</p><p>UAAMS team</p>`;
  return { subject, text, html };
}

async function claimEmailLog(db, logRef, logData) {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const existing = snapshot.exists ? snapshot.data() : null;
    if (existing?.status === "sent") {
      return { state: "sent", providerId: existing.providerMessageId || null };
    }
    if (existing?.status === "sending" && existing.startedAt?.toMillis) {
      const ageMs = Date.now() - existing.startedAt.toMillis();
      if (ageMs < ACTIVE_SEND_LEASE_MS) return { state: "sending" };
    }
    const now = Timestamp.now();
    transaction.set(
      logRef,
      {
        ...logData,
        status: "sending",
        attempts: (existing?.attempts || 0) + 1,
        startedAt: now,
        updatedAt: now,
        lastErrorCode: null,
        providerStatus: null,
        ...(snapshot.exists ? {} : { createdAt: now }),
      },
      { merge: true }
    );
    return { state: "claimed" };
  });
}

async function handlePost(request) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) return errorResponse("auth/missing-token", 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("request/invalid-json", 400);
  }
  const applicationId =
    body && typeof body.applicationId === "string" ? body.applicationId.trim() : "";
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(applicationId) ||
    Object.keys(body).some((key) => key !== "applicationId")
  ) {
    return errorResponse("request/invalid-body", 400);
  }

  let auth;
  let db;
  try {
    auth = getAdminAuth();
    db = getAdminDb();
  } catch (error) {
    console.error("[status-email] server configuration failed:", safeErrorCode(error));
    return errorResponse("server/configuration-error", 500);
  }

  let caller;
  try {
    caller = await auth.verifyIdToken(token);
  } catch {
    return errorResponse("auth/invalid-token", 401);
  }
  if (caller.email_verified !== true) {
    return errorResponse("auth/email-not-verified", 403);
  }

  const adminSnapshot = await db.collection("users").doc(caller.uid).get();
  const adminProfile = adminSnapshot.exists ? adminSnapshot.data() : null;
  if (adminProfile?.role !== "admin" || !adminProfile.universityId) {
    return errorResponse("auth/admin-required", 403);
  }

  const applicationSnapshot = await db.collection("applications").doc(applicationId).get();
  if (!applicationSnapshot.exists) return errorResponse("application/not-found", 404);
  const application = applicationSnapshot.data();
  if (application.universityId !== adminProfile.universityId) {
    return errorResponse("application/not-found", 404);
  }
  if (application.status !== "under_review") {
    return errorResponse("status/not-under-review", 409);
  }
  if (!application.studentUid) {
    return errorResponse("application/missing-student", 409);
  }

  let student;
  try {
    student = await auth.getUser(application.studentUid);
  } catch {
    return errorResponse("application/student-not-found", 409);
  }
  if (!student.email || student.emailVerified !== true) {
    return errorResponse("application/student-email-unavailable", 409);
  }

  const message = buildStatusEmail(application.form?.universityName);
  const logId = `status-under_review-${applicationId}`;
  const logRef = db.collection("emailLogs").doc(logId);
  const claim = await claimEmailLog(db, logRef, {
    eventType: "status-update",
    provider: "resend",
    applicationId,
    statusValue: "under_review",
    studentUid: application.studentUid,
    universityId: application.universityId,
    requestedBy: caller.uid,
  });

  if (claim.state === "sent") {
    return NextResponse.json({ ok: true, alreadySent: true, providerId: claim.providerId, logId });
  }
  if (claim.state === "sending") {
    return errorResponse("email/send-in-progress", 409);
  }

  let providerId;
  try {
    const result = await sendEmail({
      to: student.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
      idempotencyKey: logId,
    });
    providerId = result.providerId;
    if (!providerId) {
      const err = new Error("email/missing-provider-id");
      err.code = "email/missing-provider-id";
      throw err;
    }
  } catch (error) {
    const code = safeErrorCode(error);
    await logRef
      .set(
        {
          status: "failed",
          lastErrorCode: code,
          providerStatus: Number.isInteger(error?.providerStatus) ? error.providerStatus : null,
          failedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch((logError) => {
        console.error("[status-email] failed to record send failure:", safeErrorCode(logError));
      });
    console.error("[status-email] send failed:", code);
    return errorResponse(code, 502);
  }

  try {
    await logRef.set(
      {
        status: "sent",
        providerMessageId: providerId,
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastErrorCode: null,
        providerStatus: null,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[status-email] sent but log update failed:", safeErrorCode(error));
    return errorResponse("email/log-update-failed", 500);
  }

  return NextResponse.json({ ok: true, alreadySent: false, providerId, logId });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[status-email] request failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}
