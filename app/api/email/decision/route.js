import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";
import {
  buildDecisionEmail,
  decisionEmailIdempotencyKey,
  getBearerToken,
} from "../../../../lib/decision-email.mjs";
import { sendEmail } from "../../../../lib/email";

export const runtime = "nodejs";

const ACTIVE_SEND_LEASE_MS = 2 * 60 * 1000;

class RouteError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function errorResponse(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

function safeErrorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^[a-z0-9/_-]+$/i.test(code) ? code : "email/send-failed";
}

async function claimEmailLog(db, logRef, logData) {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const existing = snapshot.exists ? snapshot.data() : null;

    if (existing?.status === "sent") {
      return {
        state: "sent",
        providerId: existing.providerMessageId || null,
      };
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
    console.error("[decision-email] server configuration failed:", safeErrorCode(error));
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

  const applicationRef = db.collection("applications").doc(applicationId);
  const applicationSnapshot = await applicationRef.get();
  if (!applicationSnapshot.exists) {
    return errorResponse("application/not-found", 404);
  }

  const application = applicationSnapshot.data();
  if (application.universityId !== adminProfile.universityId) {
    return errorResponse("application/not-found", 404);
  }
  if (!["offer", "rejected"].includes(application.status)) {
    return errorResponse("decision/not-committed", 409);
  }
  if (!application.studentUid) {
    return errorResponse("application/missing-student", 409);
  }

  const decisionsSnapshot = await applicationRef
    .collection("decisions")
    .orderBy("decidedAt", "desc")
    .limit(1)
    .get();
  if (decisionsSnapshot.empty) {
    return errorResponse("decision/history-missing", 409);
  }

  const decisionSnapshot = decisionsSnapshot.docs[0];
  const latestDecision = decisionSnapshot.data();
  const committedMessage =
    typeof application.latestDecisionMessage === "string"
      ? application.latestDecisionMessage.trim()
      : "";
  const historyMessage =
    typeof latestDecision.message === "string" ? latestDecision.message.trim() : "";

  if (
    latestDecision.decision !== application.status ||
    !committedMessage ||
    historyMessage !== committedMessage
  ) {
    return errorResponse("decision/history-mismatch", 409);
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

  let message;
  try {
    message = buildDecisionEmail({
      decision: application.status,
      message: committedMessage,
    });
  } catch {
    return errorResponse("decision/invalid-content", 409);
  }

  const logId = `decision-${applicationId}-${decisionSnapshot.id}`;
  const logRef = db.collection("emailLogs").doc(logId);
  const claim = await claimEmailLog(db, logRef, {
    eventType: "decision",
    provider: "resend",
    applicationId,
    decisionId: decisionSnapshot.id,
    decision: application.status,
    studentUid: application.studentUid,
    universityId: application.universityId,
    requestedBy: caller.uid,
  });

  if (claim.state === "sent") {
    return NextResponse.json({
      ok: true,
      alreadySent: true,
      providerId: claim.providerId,
      logId,
    });
  }
  if (claim.state === "sending") {
    return errorResponse("email/send-in-progress", 409);
  }

  // In-app notification (PRD 4.2.2, issue #164). One per decision; a
  // failure here never blocks the email.
  await db.collection("notifications").doc(`${logId}-notice`).set({
    userId: application.studentUid,
    applicationId,
    message: `${application.form?.universityName || application.universityId} has issued a decision on your application. Open it to read the message.`,
    readStatus: false,
    createdAt: Timestamp.now(),
  }, { merge: true }).catch(() => {});

  const idempotencyKey = decisionEmailIdempotencyKey(applicationId, decisionSnapshot.id);
  let providerId;
  try {
    const result = await sendEmail({
      to: student.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
      idempotencyKey,
    });
    providerId = result.providerId;
    if (!providerId) throw new RouteError("email/missing-provider-id", 502);
  } catch (error) {
    const code = safeErrorCode(error);
    await logRef
      .set(
        {
          status: "failed",
          lastErrorCode: code,
          providerStatus: Number.isInteger(error?.providerStatus)
            ? error.providerStatus
            : null,
          failedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch((logError) => {
        console.error("[decision-email] failed to record send failure:", safeErrorCode(logError));
      });
    console.error("[decision-email] send failed:", code);
    return errorResponse(code, error instanceof RouteError ? error.status : 502);
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
    console.error("[decision-email] sent but log update failed:", safeErrorCode(error));
    return errorResponse("email/log-update-failed", 500);
  }

  return NextResponse.json({ ok: true, alreadySent: false, providerId, logId });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[decision-email] request failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}
