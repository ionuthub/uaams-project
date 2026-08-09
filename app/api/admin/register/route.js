import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

function err(code, status) {
  return NextResponse.json({ ok: false, error: code }, { status });
}

/**
 * ARCHITECTURAL & SECURITY DESIGN:
 * This route is intentionally PUBLIC (unauthenticated via Bearer header token).
 * Because a newly registering admin does not yet possess an account or auth token, 
 * access is gated entirely by the single-use, high-entropy invite code verified atomically.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, email, password } = body;
    // Accept fullName primarily; fallback to name for backward compatibility
    const fullName = body.fullName || body.name;

    // 1. Input Validation
    if (!code || typeof code !== "string" || !code.trim()) {
      return err("validation/missing-code", 400);
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return err("validation/invalid-email", 400);
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return err("validation/weak-password", 400);
    }
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return err("validation/missing-name", 400);
    }

    const normalizedCode = code.trim().toUpperCase();

    let auth, db;
    try {
      auth = getAdminAuth();
      db = getAdminDb();
    } catch {
      return err("server/configuration-error", 500);
    }

    // 2. Pre-check Invite Code Availability
    const codeRef = db.collection("inviteCodes").doc(normalizedCode);
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      return err("invite/invalid-code", 404);
    }

    const inviteData = codeSnap.data();
    if (inviteData.used) {
      return err("invite/code-already-used", 410);
    }

    const { universityId } = inviteData;
    if (!universityId) {
      console.error("[admin-register] malformed invite code missing universityId:", normalizedCode);
      return err("invite/malformed-code", 500);
    }

    // 3. Create Firebase Auth User
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email.trim(),
        password,
        displayName: fullName.trim(),
        emailVerified: false,
      });
    } catch (authErr) {
      if (authErr.code === "auth/email-already-exists") {
        return err("auth/email-already-in-use", 409);
      }
      console.error("[admin-register] auth creation failed:", authErr);
      return err("auth/creation-failed", 400);
    }

    // 4. Generate Email Verification Link (Satisfying Email Verification Requirement)
    let verificationLink;
    try {
      verificationLink = await auth.generateEmailVerificationLink(email.trim());
      console.log(`[admin-register] Verification link generated for ${email.trim()}:`, verificationLink);
      // NOTE: Hand off `verificationLink` to the email dispatch system / Ionut's email route here.
    } catch (linkErr) {
      console.error("[admin-register] failed to generate verification link:", linkErr);
    }

    // 5. Atomic Transaction: Consume Code & Set User Profile
    try {
      await db.runTransaction(async (transaction) => {
        const freshCodeSnap = await transaction.get(codeRef);
        
        if (!freshCodeSnap.exists || freshCodeSnap.data()?.used) {
          throw new Error("INVITE_CODE_UNAVAILABLE");
        }

        const userRef = db.collection("users").doc(userRecord.uid);

        // Mark code as used
        transaction.update(codeRef, {
          used: true,
          usedBy: userRecord.uid,
          usedAt: Timestamp.now(),
        });

        // Write admin profile server-side (enforcing role === 'admin' & 'fullName' schema)
        transaction.set(userRef, {
          email: email.trim(),
          fullName: fullName.trim(),
          role: "admin",
          universityId,
          createdAt: Timestamp.now(),
        });
      });
    } catch (txErr) {
      // Rollback Auth user creation if transaction fails
      try {
        await auth.deleteUser(userRecord.uid);
      } catch (cleanupErr) {
        console.error("[admin-register] auth rollback failed:", cleanupErr);
      }

      if (txErr.message === "INVITE_CODE_UNAVAILABLE") {
        return err("invite/code-already-used", 410);
      }

      console.error("[admin-register] transaction failed:", txErr);
      return err("server/internal-error", 500);
    }

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid,
      universityId,
      verificationLink,
    });
  } catch (error) {
    console.error("[admin-register] failed:", error);
    return err("server/internal-error", 500);
  }
}