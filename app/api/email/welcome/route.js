// app/api/email/welcome/route.js
// Registration confirmation email (PRD 5, issue #165). Fire-and-forget from
// the register screen right after account creation. The caller can only ever
// trigger a welcome email to their own verified-token address, one per
// account (emailLogs doc welcome-{uid}), so the route cannot be used to spam
// third parties. Email verification is NOT required here: the account was
// created seconds ago.

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

function buildWelcomeEmail(fullName) {
  const name = fullName ? fullName.split(" ")[0] : "there";
  const subject = "Welcome to UAAMS - your account is ready";
  const text = [
    `Hello ${name},`,
    "",
    "Your UAAMS account has been created.",
    "Next step: verify your email address using the verification message we sent you, then sign in to start an application.",
    "",
    "Sign in: https://www.uaams.website/login",
    "",
    "UAAMS team",
  ].join("\n");
  const html = `<p>Hello ${escapeHtml(name)},</p><p>Your UAAMS account has been created.</p><p>Next step: verify your email address using the verification message we sent you, then <a href="https://www.uaams.website/login">sign in</a> to start an application.</p><p>UAAMS team</p>`;
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

  let auth;
  let db;
  try {
    auth = getAdminAuth();
    db = getAdminDb();
  } catch (error) {
    console.error("[welcome-email] server configuration failed:", safeErrorCode(error));
    return errorResponse("server/configuration-error", 500);
  }

  let caller;
  try {
    caller = await auth.verifyIdToken(token);
  } catch {
    return errorResponse("auth/invalid-token", 401);
  }
  if (!caller.email) return errorResponse("auth/email-unavailable", 409);

  const profileSnapshot = await db.collection("users").doc(caller.uid).get();
  const profile = profileSnapshot.exists ? profileSnapshot.data() : null;
  if (!profile || profile.role !== "student") {
    return errorResponse("auth/student-required", 403);
  }

  const message = buildWelcomeEmail(profile.fullName);
  const logId = `welcome-${caller.uid}`;
  const logRef = db.collection("emailLogs").doc(logId);
  const claim = await claimEmailLog(db, logRef, {
    eventType: "welcome",
    provider: "resend",
    studentUid: caller.uid,
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
      to: caller.email,
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
        console.error("[welcome-email] failed to record send failure:", safeErrorCode(logError));
      });
    console.error("[welcome-email] send failed:", code);
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
    console.error("[welcome-email] sent but log update failed:", safeErrorCode(error));
    return errorResponse("email/log-update-failed", 500);
  }

  return NextResponse.json({ ok: true, alreadySent: false, providerId, logId });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[welcome-email] request failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}
