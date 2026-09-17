// Isolated render fixture based on the existing Playwright test record supplied
// for this task. No account is created and no production service is contacted.
const timestamp = (value) => ({ toDate: () => new Date(value) });
const id = "pfaXhvbmmk55N8mwb1Xm";
const application = {
  id, referenceNumber: "APP-2026-00001", studentUid: "existing-test-applicant",
  universityId: "solent", status: "offer",
  createdAt: timestamp("2026-08-10T14:25:00Z"), submittedAt: timestamp("2026-08-10T14:25:00Z"), updatedAt: timestamp("2026-08-10T16:07:00Z"),
  latestDecisionMessage: "Automated regression decision. This offer was recorded by the Playwright admin-path test.",
  form: { fullName: "Playwright Test Student", dateOfBirth: "2003-05-14", passportNumber: "E2E123456", nationality: "Romanian", phone: "07000000000", address: "1 Test Street, Southampton", previousQualification: "A Levels", institutionName: "Test College", graduationYear: "2024", gpa: "AAB", studyLevel: "Undergraduate", universityName: "Southampton Solent University" },
  documents: {}, documentPath: null,
};
const admin = () => location.pathname.startsWith("/admin");
export function watchAuth(callback) {
  let active = true;
  queueMicrotask(() => { if (active) callback({ uid: admin() ? "existing-test-admin" : application.studentUid, emailVerified: true, displayName: admin() ? "Admissions officer" : "Playwright Test Student" }); });
  return () => { active = false; };
}
export const getUserProfile = async () => ({ role: admin() ? "admin" : "student", universityId: "solent", fullName: admin() ? "Admissions officer" : "Playwright Test Student" });
export const getStudentApplications = async () => [application, { ...application, id: "QJTfPmDEzbFuwfyUhxuT", referenceNumber: "APP-2026-00002", status: "submitted", latestDecisionMessage: null }];
export const getApplicationsForUniversity = getStudentApplications;
export const getApplication = async () => new URLSearchParams(location.search).has("fallback") ? { ...application, referenceNumber: undefined } : application;
export const getUniversities = async () => [{ id: "solent", name: "Southampton Solent University" }];
export const getNotifications = async () => [];
export const getDecisionHistory = async () => [{ id: "existing-decision", decision: "offer", message: application.latestDecisionMessage, decidedAt: application.updatedAt }];
export const getDecisionEmailLog = async () => ({ status: "sent", providerMessageId: "test-record" });
export const WITHDRAWABLE_STATUSES = ["submitted", "under_review"];
export const DOC_TYPES = [["passportCopy", "Passport copy"], ["transcripts", "Transcripts"], ["certificates", "Certificates"], ["englishTest", "English test"]];
const disabled = async () => { throw new Error("Mutations are disabled in the isolated UI fixture."); };
export { disabled as logout, disabled as withdrawApplication, disabled as markNotificationRead, disabled as recordDecision, disabled as startReview, disabled as getDocumentUrl };
export const logCsvExport = async () => {};
