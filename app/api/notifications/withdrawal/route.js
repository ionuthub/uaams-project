// app/api/notifications/withdrawal/route.js
// Admin in-app notification when a student withdraws (#194).
//
// Called by the student's browser after a successful withdrawal. The route
// does not take the caller's word for it: it re-reads the application and
// only notifies when the status really is "withdrawn" and the caller owns
// the record. One notification per admin of the university, written with a
// fixed ID so a repeated request can never produce duplicates. No email is
// sent - admin-facing email does not exist in this system, only the in-app
// list does.

import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";
import { getBearerToken } from "../../../../lib/decision-email.mjs";

export const runtime = "nodejs";

function errorResponse(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

function safeErrorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^[a-z0-9/_-]+$/i.test(code) ? code : "notification/write-failed";
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
    console.error("[withdrawal-notice] server configuration failed:", safeErrorCode(error));
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

  const applicationSnapshot = await db.collection("applications").doc(applicationId).get();
  if (!applicationSnapshot.exists) return errorResponse("application/not-found", 404);
  const application = applicationSnapshot.data();
  if (application.studentUid !== caller.uid) {
    return errorResponse("application/not-found", 404);
  }
  if (application.status !== "withdrawn") {
    return errorResponse("status/not-withdrawn", 409);
  }

  const admins = await db
    .collection("users")
    .where("role", "==", "admin")
    .where("universityId", "==", application.universityId)
    .get();

  // The message names the university and the reference, never the student.
  // An admin who wants details opens the application itself.
  const universityName = application.form?.universityName || application.universityId;
  const message = `An applicant withdrew their application to ${universityName} (ref ${applicationId}).`;
  const now = Timestamp.now();

  let created = 0;
  await Promise.all(
    admins.docs.map(async (adminDoc) => {
      const ref = db
        .collection("notifications")
        .doc(`withdrawn-${applicationId}-${adminDoc.id}`);
      try {
        // create() (not set) so a repeated request leaves the existing
        // notification untouched - including a readStatus the admin already
        // flipped - instead of resetting it to unread.
        await ref.create({
          userId: adminDoc.id,
          applicationId,
          message,
          readStatus: false,
          createdAt: now,
        });
        created += 1;
      } catch (error) {
        if (error?.code !== 6) throw error; // 6 = ALREADY_EXISTS (idempotent replay)
      }
    })
  );

  return NextResponse.json({ ok: true, admins: admins.size, created });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[withdrawal-notice] request failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}
