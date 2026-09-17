import { formatReference } from "./application-reference.mjs";

function fail(code, status) {
  throw Object.assign(new Error(code), { code, status });
}

/** Run only with the Admin SDK. Authorization is rechecked inside the transaction. */
export async function ensureApplicationReference(db, applicationId, actor, now = new Date()) {
  if (!actor?.uid || actor.email_verified !== true) fail("auth/forbidden", 403);
  if (typeof applicationId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(applicationId)) {
    fail("request/invalid-application-id", 400);
  }
  const appRef = db.collection("applications").doc(applicationId);
  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(appRef);
    if (!snapshot.exists) fail("application/not-found", 404);
    const application = snapshot.data();
    if (application.studentUid !== actor.uid) {
      const profile = await tx.get(db.collection("users").doc(actor.uid));
      if (!profile.exists || profile.data().role !== "admin" ||
          !profile.data().universityId || profile.data().universityId !== application.universityId) {
        // Match absent and inaccessible records; do not reveal other applicants' references.
        fail("application/not-found", 404);
      }
    }
    if (application.referenceNumber) return application.referenceNumber;
    // Drafts receive their reference when first saved/viewed. Submitted legacy
    // applications use their original submission year, never the migration year.
    const dateValue = application.submittedAt || application.createdAt;
    const date = typeof dateValue?.toDate === "function" ? dateValue.toDate() : new Date(dateValue || now);
    if (Number.isNaN(date.getTime())) fail("reference/invalid-date", 409);
    const year = date.getUTCFullYear();
    const counterRef = db.collection("applicationReferenceCounters").doc(String(year));
    const counter = await tx.get(counterRef);
    const previous = counter.exists ? counter.data().lastSequence : 0;
    if (!Number.isSafeInteger(previous) || previous < 0) fail("reference/invalid-counter", 409);
    const sequence = previous + 1;
    const referenceNumber = formatReference(year, sequence);
    const reservationRef = db.collection("applicationReferences").doc(referenceNumber);
    const reservation = await tx.get(reservationRef);
    if (reservation.exists) fail("reference/counter-conflict", 409);
    // All reads precede writes. Counter and reservation conflicts cause Firestore
    // to retry, so concurrent requests cannot allocate one number twice.
    tx.set(counterRef, { lastSequence: sequence });
    tx.create(reservationRef, { applicationId });
    tx.update(appRef, { referenceNumber });
    // Do not change submittedAt/updatedAt, status, form, documents or audit history.
    return referenceNumber;
  });
}

export async function referenceResponse(request, { getAuth, getDb }) {
  const respond = (data, status = 200) => Response.json(data, {
    status, headers: { "Cache-Control": "no-store" },
  });
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return respond({ code: "auth/missing-token" }, 401);
  let body;
  try { body = await request.json(); } catch { return respond({ code: "request/invalid-json" }, 400); }
  const ids = body?.applicationIds;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 20 ||
      ids.some((id) => typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) {
    return respond({ code: "request/invalid-body" }, 400);
  }
  let auth, db;
  try { auth = getAuth(); db = getDb(); } catch { return respond({ code: "server/configuration-error" }, 503); }
  let actor;
  try { actor = await auth.verifyIdToken(token); } catch { return respond({ code: "auth/invalid-token" }, 401); }
  if (actor.email_verified !== true) return respond({ code: "auth/email-not-verified" }, 403);
  const references = Object.create(null);
  try {
    // Sequential allocation avoids contention on the annual counter in a batch.
    for (const id of new Set(ids)) references[id] = await ensureApplicationReference(db, id, actor);
    return respond({ references });
  } catch (error) {
    return respond({ code: error.status ? error.code : "reference/unavailable" }, error.status || 503);
  }
}
