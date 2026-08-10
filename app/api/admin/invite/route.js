// app/api/admin/invite/route.js
// An admissions officer invites a colleague (#195).
//
// WHY AN INVITE RATHER THAN A CREATE
// If an admin created the account outright they would have to choose their
// colleague password and then send it somewhere. Nobody should ever know
// somebody else password. Here the invited person sets their own.
//
// WHY THIS IS SAFE TO EXPOSE
// The entry point sits behind the admin sign-in, and the university is read
// from the CALLER profile - never from the request body. An officer can only
// ever invite into their own institution, which is the same boundary the
// isolation test protects.
//
// The raw token exists only in the emailed link. Firestore stores its SHA-256
// hash, so reading the database never yields a usable invitation.

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";
import { getBearerToken } from "../../../../lib/decision-email.mjs";
import { sendEmail } from "../../../../lib/email";

export const runtime = "nodejs";

const INVITE_DAYS = 7;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function errorResponse(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

function safeErrorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^[a-z0-9/_-]+$/i.test(code) ? code : "invite/failed";
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Resolves the caller and refuses anyone who is not a scoped admin.
async function requireAdmin(request, auth, db) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) return { error: errorResponse("auth/missing-token", 401) };

  let caller;
  try {
    caller = await auth.verifyIdToken(token);
  } catch {
    return { error: errorResponse("auth/invalid-token", 401) };
  }
  if (caller.email_verified !== true) {
    return { error: errorResponse("auth/email-not-verified", 403) };
  }

  const profileSnapshot = await db.collection("users").doc(caller.uid).get();
  const profile = profileSnapshot.exists ? profileSnapshot.data() : null;
  if (!profile || profile.role !== "admin" || !profile.universityId) {
    // Deliberately the same shape as any other refusal: a student probing this
    // endpoint learns nothing about why it said no.
    return { error: errorResponse("auth/not-an-admin", 403) };
  }

  return { caller, profile };
}

async function handlePost(request) {
  let auth;
  let db;
  try {
    auth = getAdminAuth();
    db = getAdminDb();
  } catch (error) {
    console.error("[admin-invite] server configuration failed:", safeErrorCode(error));
    return errorResponse("server/configuration-error", 500);
  }

  const gate = await requireAdmin(request, auth, db);
  if (gate.error) return gate.error;
  const { caller, profile } = gate;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("request/invalid-json", 400);
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return errorResponse("request/invalid-email", 400);
  }
  if (Object.keys(body).some((key) => key !== "email")) {
    return errorResponse("request/invalid-body", 400);
  }

  // Firebase allows one account per address across the whole project, so this
  // would fail later anyway. Failing here gives a message worth reading.
  try {
    await auth.getUserByEmail(email);
    return errorResponse("invite/address-in-use", 409);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!appUrl) {
    console.error("[admin-invite] NEXT_PUBLIC_APP_URL is not configured");
    return errorResponse("server/configuration-error", 500);
  }

  // Re-inviting is normal - people lose emails. Retire any outstanding
  // invitation for this address first so only one link is ever live.
  const outstanding = await db
    .collection("adminInvites")
    .where("email", "==", email)
    .where("status", "==", "pending")
    .get();
  await Promise.all(outstanding.docs.map((d) => d.ref.update({ status: "revoked" })));

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + INVITE_DAYS * 86400000);

  const inviteRef = await db.collection("adminInvites").add({
    email,
    // From the caller profile. Never from the request - that is the whole
    // reason an admin cannot plant an account at another institution.
    universityId: profile.universityId,
    invitedBy: caller.uid,
    invitedByName: profile.fullName || profile.email || "A colleague",
    tokenHash: hashToken(rawToken),
    status: "pending",
    createdAt: now,
    expiresAt,
  });

  const link = appUrl + "/admin/register?token=" + rawToken;
  const inviterName = profile.fullName || "A colleague";

  try {
    await sendEmail({
      to: email,
      subject: "You have been invited to the UAAMS admissions portal",
      text: [
        inviterName + " has invited you to join the admissions team on UAAMS.",
        "",
        "Set your password and sign in here:",
        link,
        "",
        "This link can be used once and expires in " + INVITE_DAYS + " days.",
        "If you were not expecting this, you can ignore it - no account exists yet.",
      ].join("\n"),
      idempotencyKey: "admin-invite-" + inviteRef.id,
    });
  } catch (error) {
    // The invitation is useless if the link never arrives, so do not leave a
    // pending row behind implying one is outstanding.
    await inviteRef.update({ status: "revoked" });
    console.error("[admin-invite] send failed:", safeErrorCode(error));
    return errorResponse("invite/email-failed", 502);
  }

  return NextResponse.json({ ok: true, inviteId: inviteRef.id, email });
}

// Lets the invite page show what is outstanding. Never returns tokenHash.
async function handleGet(request) {
  let auth;
  let db;
  try {
    auth = getAdminAuth();
    db = getAdminDb();
  } catch (error) {
    console.error("[admin-invite] server configuration failed:", safeErrorCode(error));
    return errorResponse("server/configuration-error", 500);
  }

  const gate = await requireAdmin(request, auth, db);
  if (gate.error) return gate.error;

  const snapshot = await db
    .collection("adminInvites")
    .where("universityId", "==", gate.profile.universityId)
    .get();

  const invites = snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        status: data.status,
        invitedByName: data.invitedByName || null,
        createdAt: data.createdAt ? data.createdAt.toMillis() : null,
        expiresAt: data.expiresAt ? data.expiresAt.toMillis() : null,
      };
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return NextResponse.json({ ok: true, invites });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[admin-invite] request failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}

export async function GET(request) {
  try {
    return await handleGet(request);
  } catch (error) {
    console.error("[admin-invite] list failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}
