// lib/payments.js
// v2 Phase 1: payment records (mock provider for the PoC).
// Field shape agreed with Ionut's payment UI mock. Never store card data —
// providerRef is the provider's transaction reference only.
import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { getDbClient } from "./firebase";

/** Record a mock payment with denormalized fields for rule scoping. */
export async function recordMockPayment(applicationId, universityId, studentUid, amountPence) {
  const db = getDbClient();
  const ref = await addDoc(collection(db, "payments"), {
    applicationId,
    universityId,         // Denormalized for query-provable rules
    paidBy: studentUid,    // Denormalized for query-provable rules
    amount: amountPence,
    currency: "GBP",
    status: "paid",       // mock: real provider integration is future work
    providerRef: `MOCK-${Date.now()}`,
    createdAt: serverTimestamp(),
    paidAt: serverTimestamp(),
  });
  return ref.id;
}

/** All payment records for one application, scoped by student for rule validation. */
export async function getPaymentsForApplication(applicationId, studentUid) {
  const db = getDbClient();
  
  // The where("paidBy") constraint satisfies the root-level rule engine filter requirement
  const snap = await getDocs(query(
    collection(db, "payments"),
    where("applicationId", "==", applicationId),
    where("paidBy", "==", studentUid),
    orderBy("createdAt", "desc")
  ));
  
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}