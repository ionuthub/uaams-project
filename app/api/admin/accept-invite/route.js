// app/api/admin/accept-invite/route.js
// The invited colleague sets their own password and the account is created (#195).
//
// This route is deliberately PUBLIC - the person calling it has no account yet,
// so there is nothing to authenticate them with. The invitation token is the
// credential, which is why it must be single-use, expiring and hashed at rest.
//
// WHY THIS MUST BE A SERVER ROUTE
// firestore.rules forces every self-created profile to role == student. A
// browser can never write role: admin, by design. Creating an admissions
// officer therefore has to happen with the Admin SDK, behind a check nobody
// can bypass. That constraint is a feature - do not weaken the rule to make
// this easier.

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

function errorResponse(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

function safeErrorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^[a-z0-9/_-]+$/i.test(code) ? code : "invite/accept-failed";
}

// Mirrors the client-side rule in lib/validation.js so the message a person
// sees in the form is the one the server actually enforces.
function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Use at least 8 characters.";
  }
  if (password.length > 200) return "That password is too long.";
  if (!/[A-Z]/.test(password)) return "Include one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Include one number.";
  return null;
}

async function handlePost(request) {
  let auth;
  let db;
  try {
    auth = getAdminAuth();
    db = getAdminDb();
  } catch (error) {
    console.error("[accept-invite] server configuration failed:", safeErrorCode(error));
    return errorResponse("server/configuration-error", 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("request/invalid-json", 400);
  }

  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    return errorResponse("invite/invalid-token", 400);
  }
  if (fullName.length < 1 || fullName.length > 100) {
    return errorResponse("request/invalid-name", 400);
  }
  if (passwordProblem(password)) {
    return errorResponse("request/weak-password", 400);
  }
  if (Object.keys(body).some((key) => !["token", "password", "fullName"].includes(key))) {
    return errorResponse("request/invalid-body", 400);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const matches = await db
    .collection("adminInvites")
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  if (matches.empty) return errorResponse("invite/not-found", 404);

  const inviteRef = matches.docs[0].ref;
  const invite = matches.docs[0].data();

  // One refusal code for every unusable invitation. A stranger holding an old
  // link learns that it does not work, not why - and not whether the address
  // it was issued to has an account.
  if (invite.status !== "pending") return errorResponse("invite/not-usable", 410);
  if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
    await inviteRef.update({ status: "revoked" });
    return errorResponse("invite/not-usable", 410);
  }

  // Re-checked at the moment of use, not just when the invitation was issued.
  try {
    await auth.getUserByEmail(invite.email);
    await inviteRef.update({ status: "revoked" });
    return errorResponse("invite/address-in-use", 409);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  const user = await auth.createUser({
    email: invite.email,
    password,
    displayName: fullName,
    // Receiving the invitation proves control of the address, so there is
    // nothing further to verify.
    emailVerified: true,
  });

  try {
    await db.collection("users").doc(user.uid).set({
      fullName,
      email: invite.email,
      role: "admin",
      // From the invitation, never from the request. The person accepting has
      // no say in which institution they join.
      universityId: invite.universityId,
      invitedBy: invite.invitedBy || null,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    // An Auth account without a profile can sign in and reach nothing, which
    // is confusing for them and invisible to us. Roll it back.
    await auth.deleteUser(user.uid).catch(() => {});
    throw error;
  }

  await inviteRef.update({ status: "accepted", acceptedAt: Timestamp.now() });

  return NextResponse.json({ ok: true, email: invite.email });
}

// Lets the registration page show who is being invited, and fail early on a
// dead link rather than after somebody has typed a password.
async function handleGet(request) {
  let db;
  try {
    db = getAdminDb();
  } catch (error) {
    console.error("[accept-invite] server configuration failed:", safeErrorCode(error));
    return errorResponse("server/configuration-error", 500);
  }

  const token = (new URL(request.url).searchParams.get("token") || "").trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    return errorResponse("invite/invalid-token", 400);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const matches = await db
    .collection("adminInvites")
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  if (matches.empty) return errorResponse("invite/not-found", 404);
  const invite = matches.docs[0].data();

  if (invite.status !== "pending") return errorResponse("invite/not-usable", 410);
  if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
    return errorResponse("invite/not-usable", 410);
  }

  let universityName = invite.universityId;
  try {
    const uni = await db.collection("universities").doc(invite.universityId).get();
    if (uni.exists) universityName = uni.data().name || universityName;
  } catch {
    // Cosmetic only - the id is a fine fallback.
  }

  return NextResponse.json({
    ok: true,
    email: invite.email,
    universityName,
    invitedByName: invite.invitedByName || null,
  });
}

export async function POST(request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[accept-invite] request failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}

export async function GET(request) {
  try {
    return await handleGet(request);
  } catch (error) {
    console.error("[accept-invite] lookup failed:", safeErrorCode(error));
    return errorResponse("server/internal-error", 500);
  }
}
