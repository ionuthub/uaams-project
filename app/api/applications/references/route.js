import { getAdminAuth, getAdminDb } from "../../../../lib/firebase-admin";
import { referenceResponse } from "../../../../lib/application-reference-server.mjs";

export const runtime = "nodejs";

export async function POST(request) {
  return referenceResponse(request, { getAuth: getAdminAuth, getDb: getAdminDb });
}
