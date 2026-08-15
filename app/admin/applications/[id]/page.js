// app/admin/applications/[id]/page.js
// Route: /admin/applications/{id} (issue #13 - admin detail and decision view).
//
// Completes the Sprint 2 admin path on real data: the scoped admissions
// officer opens one application, reads the submitted form, views the
// uploaded document through the storage rules, records an offer or reject
// with a custom message (lib/db.js recordDecision, which also writes the
// append-only decisions audit log for IS-05), and then triggers the
// decision email through the protected server route. Email delivery state
// comes from the emailLogs record the route maintains, so what this page
// shows is what actually happened, never an assumption.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthCard from "../../../../components/auth/AuthCard";
import AlertBanner from "../../../../components/auth/AlertBanner";
import LoadingButton from "../../../../components/auth/LoadingButton";
import StatusBadge from "../../../../components/StatusBadge";
import { watchAuth, getUserProfile } from "../../../../lib/auth";
import {
  getApplication,
  getDecisionHistory,
  getDecisionEmailLog,
  recordDecision,
  startReview,
} from "../../../../lib/db";
import { getDocumentUrl, DOC_TYPES } from "../../../../lib/storage";
import PortalShell from "../../../../components/portal/PortalShell";

const FORM_FIELDS = [
  ["fullName", "Full name"],
  ["dateOfBirth", "Date of birth"],
  ["passportNumber", "Passport number"],
  ["nationality", "Nationality"],
  ["phone", "Phone"],
  ["address", "Address"],
  ["previousQualification", "Previous qualification"],
  ["institutionName", "Institution name"],
  ["graduationYear", "Graduation year"],
  ["gpa", "GPA / Grade"],
  ["courseName", "Course name"],
  ["studyLevel", "Intended study level"],
  ["intake", "Intake"],
];

const ADMIN_NAV = [{ key: "queue", label: "Application queue", href: "/admin" }];
// #196: Student view removed - staff accounts are not applicant accounts.
const ADMIN_FOOTER = [{ label: "Privacy", href: "/privacy" }];

function formatDateTime(value) {
  if (!value) return "-";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emailStatusCopy(log) {
  if (!log) return "No send attempt recorded yet.";
  if (log.status === "sent") return `Sent to the student (provider id ${log.providerMessageId || "recorded"}).`;
  if (log.status === "sending") return "A send attempt is currently in progress.";
  if (log.status === "failed") return `The last send attempt failed (${log.lastErrorCode || "unknown error"}).`;
  return `Status: ${log.status || "unknown"}.`;
}

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const applicationId = typeof params?.id === "string" ? params.id : "";

  const [phase, setPhase] = useState("loading"); // loading | signed-out | denied | not-found | error | ready
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [emailLog, setEmailLog] = useState(null);

  const [choice, setChoice] = useState("");
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [documentError, setDocumentError] = useState(null);

  const loadCaseData = useCallback(
    async (adminProfile) => {
      const record = await getApplication(applicationId);
      if (!record || record.universityId !== adminProfile.universityId) {
        return { state: "not-found" };
      }
      const history = await getDecisionHistory(applicationId);
      let log = null;
      if (history.length > 0) {
        try {
          log = await getDecisionEmailLog(applicationId, history[0].id);
        } catch (error) {
          console.warn("Email log unavailable:", error?.code || error?.message);
        }
      }
      return { state: "ready", record, history, log };
    },
    [applicationId]
  );

  useEffect(() => {
    if (!applicationId) {
      setPhase("not-found");
      return undefined;
    }
    let active = true;
    let authRun = 0;
    const unsubscribe = watchAuth(async (current) => {
      const run = ++authRun;
      const isCurrent = () => active && run === authRun;
      if (!current) {
        if (isCurrent()) setPhase("signed-out");
        return;
      }
      if (!isCurrent()) return;
      setPhase("loading");
      try {
        const adminProfile = await getUserProfile(current.uid);
        if (!isCurrent()) return;
        if (!adminProfile || adminProfile.role !== "admin" || !adminProfile.universityId) {
          setPhase("denied");
          return;
        }
        const result = await loadCaseData(adminProfile);
        if (!isCurrent()) return;
        if (result.state === "not-found") {
          setPhase("not-found");
          return;
        }
        setUser(current);
        setProfile(adminProfile);
        setApplication(result.record);
        setDecisions(result.history);
        setEmailLog(result.log);
        setPhase("ready");
      } catch (error) {
        if (!isCurrent()) return;
        if (error?.code === "permission-denied") {
          setPhase("not-found");
          return;
        }
        console.error("Admin detail failed to load:", error);
        setPhase("error");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [applicationId, loadCaseData]);

  async function refresh() {
    const result = await loadCaseData(profile);
    if (result.state === "ready") {
      setApplication(result.record);
      setDecisions(result.history);
      setEmailLog(result.log);
    }
  }

  async function requestDecisionEmail() {
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/email/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) return { ok: true };
      return { ok: false, code: data.error || `http-${response.status}` };
    } catch {
      return { ok: false, code: "network-error" };
    }
  }

  async function handleStartReview() {
    setReviewBusy(true);
    setNotice(null);
    try {
      await startReview(applicationId);
    } catch (error) {
      console.error("Start review failed:", error);
      setNotice({ type: "error", text: "The status could not be changed. Please try again." });
      setReviewBusy(false);
      return;
    }
    let emailOk = false;
    let emailCode = null;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/email/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId }),
      });
      const data = await response.json().catch(() => ({}));
      emailOk = response.ok && data.ok;
      if (!emailOk) emailCode = data.error || `http-${response.status}`;
    } catch {
      emailCode = "network-error";
    }
    try {
      await refresh();
    } catch (error) {
      console.warn("Refresh after review failed:", error?.code || error?.message);
    }
    setReviewBusy(false);
    if (emailOk) {
      setNotice({ type: "success", text: "Application moved to under review and the student was emailed." });
    } else {
      setNotice({ type: "error", text: `Application moved to under review, but the status email did not send (${emailCode}). The attempt is logged.` });
    }
  }

  async function handleDecision(event) {
    event.preventDefault();
    // PRD-UX-03 (#231): a decision is append-only - it can be superseded but
    // never corrected - and the student is emailed immediately, so it gets a
    // confirmation. The browser-native confirm is used deliberately: it is
    // focus-trapped, announced to assistive tech and dismissible with Escape
    // out of the box. Restyling to the in-page dialog pattern used for
    // withdrawal is a follow-up, not a prerequisite.
    // "Move to under review" deliberately has NO confirmation: it is a
    // reversible pipeline step - an offer or rejection can still follow it.
    if (
      !window.confirm(
        "Record this decision now? It is permanent - it can be superseded but not edited - and the student will be emailed immediately."
      )
    ) {
      return;
    }
    const trimmedMessage = message.trim();
    const nextErrors = {};
    if (!choice) nextErrors.choice = "Choose offer or reject.";
    if (!trimmedMessage) nextErrors.message = "Write the message the student will receive.";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    setNotice(null);
    try {
      await recordDecision(applicationId, user.uid, choice, trimmedMessage);
    } catch (error) {
      console.error("Decision write failed:", error);
      setNotice({ type: "error", text: "The decision could not be saved. Nothing was sent to the student." });
      setBusy(false);
      return;
    }

    const emailResult = await requestDecisionEmail();
    try {
      await refresh();
    } catch (error) {
      console.warn("Refresh after decision failed:", error?.code || error?.message);
    }
    setChoice("");
    setMessage("");
    setBusy(false);
    if (emailResult.ok) {
      setNotice({ type: "success", text: "Decision recorded and the decision email was sent to the student." });
    } else {
      setNotice({
        type: "error",
        text: `Decision recorded and visible to the student, but the email did not send (${emailResult.code}). Use Retry email below; the attempt is logged.`,
      });
    }
  }

  async function handleRetryEmail() {
    setEmailBusy(true);
    setNotice(null);
    const emailResult = await requestDecisionEmail();
    try {
      await refresh();
    } catch (error) {
      console.warn("Refresh after retry failed:", error?.code || error?.message);
    }
    setEmailBusy(false);
    if (emailResult.ok) {
      setNotice({ type: "success", text: "The decision email was sent to the student." });
    } else {
      setNotice({ type: "error", text: `The email still did not send (${emailResult.code}).` });
    }
  }

  async function handleOpenDocument(path) {
    setDocumentError(null);
    try {
      const url = await getDocumentUrl(path);
      window.open(url, "_blank", "noopener");
    } catch (error) {
      console.error("Document open failed:", error);
      setDocumentError("The document could not be opened. Storage may not be enabled yet, or access was denied.");
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard title="Application detail">
        <p className="text-muted text-[0.9rem] my-1" role="status">Loading the application...</p>
      </AuthCard>
    );
  }
  if (phase === "signed-out") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">Sign in with an admissions account to view this application.</AlertBanner>
        <p className="text-muted text-[0.9rem] my-1"><a href="/admin/login">Go to staff sign-in</a></p>
      </AuthCard>
    );
  }
  if (phase === "denied") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">This area is only available to admissions officers.</AlertBanner>
        <p className="text-muted text-[0.9rem] my-1"><a href="/">Back to the homepage</a></p>
      </AuthCard>
    );
  }
  if (phase === "not-found") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">
          This application does not exist or is not part of your university's queue.
        </AlertBanner>
        <p className="text-muted text-[0.9rem] my-1"><a href="/admin">Back to the application queue</a></p>
      </AuthCard>
    );
  }
  if (phase === "error") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">The application could not be loaded. Please try again.</AlertBanner>
        <LoadingButton loading={false} onClick={() => window.location.reload()}>Try again</LoadingButton>
      </AuthCard>
    );
  }

  const latestDecision = decisions[0] || null;
  const isWithdrawn = application.status === "withdrawn";
  const decidable = !isWithdrawn && ["submitted", "under_review", "offer", "rejected"].includes(application.status);
  const showRetryEmail = latestDecision && (!emailLog || emailLog.status !== "sent");

  return (
    <PortalShell
      user={user}
      current="queue"
      nav={ADMIN_NAV}
      subtitle="Admissions"
      roleLabel="Admissions officer"
      footerLinks={ADMIN_FOOTER}
    >
      <div className="max-w-[860px] mx-auto my-10 pt-0 px-4 pb-16 grid gap-5">
      <header className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="mt-0 mb-1.5 text-[0.85rem] text-muted"><a className="text-link font-medium" href="/admin"><span aria-hidden="true">&larr;</span> Application queue</a> / <span className="font-mono text-[0.85rem] text-muted [overflow-wrap:anywhere]">{application.id}</span></p>
          <h1 className="mt-0 mb-1 text-2xl text-navy-900 font-editorial">Application detail</h1>
          <p className="text-muted text-[0.9rem] my-1">Signed in as {profile.fullName} ({profile.email})</p>
        </div>
        <StatusBadge status={application.status} />
      </header>

      {notice && <AlertBanner variant={notice.type}>{notice.text}</AlertBanner>}

      <section className="bg-white border border-border rounded-lg px-[1.4rem] py-5 shadow-sm [&_h2]:mt-0 [&_h2]:mb-[0.9rem] [&_h2]:text-[1.1rem] [&_h2]:text-navy-900 [&_h3]:mt-[1.1rem] [&_h3]:mb-1.5 [&_h3]:text-[0.95rem]" aria-labelledby="application-summary">
        <h2 id="application-summary">Summary</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 m-0 max-sm:grid-cols-1 [&_dt]:text-[0.78rem] [&_dt]:uppercase [&_dt]:tracking-[0.04em] [&_dt]:text-quiet [&_dd]:mt-[0.15rem] [&_dd]:text-[0.95rem] [&_dd]:[overflow-wrap:anywhere]">
          <div><dt>University</dt><dd>{application.form?.universityName || application.universityId}</dd></div>
          <div><dt>Submitted</dt><dd>{formatDateTime(application.submittedAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDateTime(application.updatedAt)}</dd></div>
          <div><dt>Student ID</dt><dd className="font-mono text-[0.85rem] text-muted [overflow-wrap:anywhere]">{application.studentUid}</dd></div>
        </dl>
      </section>

      <section className="bg-white border border-border rounded-lg px-[1.4rem] py-5 shadow-sm [&_h2]:mt-0 [&_h2]:mb-[0.9rem] [&_h2]:text-[1.1rem] [&_h2]:text-navy-900 [&_h3]:mt-[1.1rem] [&_h3]:mb-1.5 [&_h3]:text-[0.95rem]" aria-labelledby="applicant-details">
        <h2 id="applicant-details">Applicant details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 m-0 max-sm:grid-cols-1 [&_dt]:text-[0.78rem] [&_dt]:uppercase [&_dt]:tracking-[0.04em] [&_dt]:text-quiet [&_dd]:mt-[0.15rem] [&_dd]:text-[0.95rem] [&_dd]:[overflow-wrap:anywhere]">
          {FORM_FIELDS.map(([key, label]) => (
            <div key={key}><dt>{label}</dt><dd>{application.form?.[key] || "-"}</dd></div>
          ))}
        </dl>
        <h3>Personal statement</h3>
        <p className="m-0 text-[0.95rem] leading-relaxed whitespace-pre-wrap">{application.form?.personalStatement || "-"}</p>
      </section>

      <section className="bg-white border border-border rounded-lg px-[1.4rem] py-5 shadow-sm [&_h2]:mt-0 [&_h2]:mb-[0.9rem] [&_h2]:text-[1.1rem] [&_h2]:text-navy-900 [&_h3]:mt-[1.1rem] [&_h3]:mb-1.5 [&_h3]:text-[0.95rem]" aria-labelledby="supporting-document">
        <h2 id="supporting-document">Supporting documents</h2>
        {application.documents && Object.keys(application.documents).length > 0 ? (
          <ul className="m-0 p-0 list-none grid gap-2">
            {DOC_TYPES.filter(([key]) => application.documents[key]?.path).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-3 flex-wrap px-3 py-2 border border-border rounded-lg bg-slate-50">
                <span className="text-[0.9rem]"><strong>{label}</strong><span className="text-muted"> {application.documents[key].name || ""}</span></span>
                <LoadingButton loading={false} full={false} onClick={() => handleOpenDocument(application.documents[key].path)}>View</LoadingButton>
              </li>
            ))}
          </ul>
        ) : application.documentPath ? (
          <>
            <p className="text-muted text-[0.9rem] my-1">{application.documentPath.split("/").pop()}</p>
            <LoadingButton loading={false} onClick={() => handleOpenDocument(application.documentPath)}>View document</LoadingButton>
          </>
        ) : (
          <p className="text-muted text-[0.9rem] my-1">No documents are attached to this application.</p>
        )}
        {documentError && <AlertBanner variant="error">{documentError}</AlertBanner>}
      </section>

      <section className="bg-white border border-border rounded-lg px-[1.4rem] py-5 shadow-sm [&_h2]:mt-0 [&_h2]:mb-[0.9rem] [&_h2]:text-[1.1rem] [&_h2]:text-navy-900 [&_h3]:mt-[1.1rem] [&_h3]:mb-1.5 [&_h3]:text-[0.95rem]" aria-labelledby="record-decision">
        <h2 id="record-decision">Record a decision</h2>
        {isWithdrawn ? (
          <AlertBanner variant="info">
            The applicant withdrew this application. It is no longer under consideration and no further action can be taken.
          </AlertBanner>
        ) : (
          <>
            {application.status === "submitted" && (
              <div className="mb-4 px-[0.85rem] py-[0.7rem] bg-slate-50 border border-border rounded-lg text-[0.9rem] flex items-center justify-between gap-3 flex-wrap">
                <span>This application has not been reviewed yet. Moving it to under review tells the student their application is being processed (PRD 4.3.2).</span>
                <LoadingButton loading={reviewBusy} onClick={handleStartReview}>Move to under review</LoadingButton>
              </div>
            )}
            {decidable ? (
              <form onSubmit={handleDecision} noValidate>
                <fieldset className="m-0 mb-2 p-0 border-0 grid gap-2 [&_legend]:text-[0.9rem] [&_legend]:font-semibold [&_legend]:mb-1.5">
                  <legend>Decision</legend>
                  <label className="flex items-center gap-2.5 min-h-11 px-3 py-1.5 border border-border-strong rounded-lg text-[0.95rem] cursor-pointer [&_input]:w-[1.05rem] [&_input]:h-[1.05rem] [&_input]:accent-blue-600">
                    <input
                      type="radio"
                      name="decision"
                      value="offer"
                      checked={choice === "offer"}
                      onChange={() => { setChoice("offer"); setFormErrors((prev) => ({ ...prev, choice: null })); }}
                    />
                    Offer a place
                  </label>
                  <label className="flex items-center gap-2.5 min-h-11 px-3 py-1.5 border border-border-strong rounded-lg text-[0.95rem] cursor-pointer [&_input]:w-[1.05rem] [&_input]:h-[1.05rem] [&_input]:accent-blue-600">
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={choice === "rejected"}
                      onChange={() => { setChoice("rejected"); setFormErrors((prev) => ({ ...prev, choice: null })); }}
                    />
                    Reject the application
                  </label>
                </fieldset>
                {formErrors.choice && <p className="text-error text-[0.85rem] mt-1.5 mb-0" role="alert">{formErrors.choice}</p>}

                <label className="block mt-[0.9rem] mb-1.5 text-[0.9rem] font-semibold" htmlFor="decision-message">Message to the student</label>
                <textarea
                  id="decision-message"
                  className="w-full px-3 py-[0.65rem] border border-border-strong rounded-lg text-[0.95rem] resize-y text-ink bg-white font-[inherit] focus:outline-[3px] focus:outline-blue-100 focus:border-blue-600"
                  rows="5"
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setFormErrors((prev) => (prev.message ? { ...prev, message: null } : prev));
                  }}
                  aria-invalid={!!formErrors.message}
                  placeholder="This message is included in the decision email and shown on the student's dashboard."
                />
                {formErrors.message && <p className="text-error text-[0.85rem] mt-1.5 mb-0" role="alert">{formErrors.message}</p>}

                <div className="mt-4 flex gap-3 items-center flex-wrap">
                  <LoadingButton type="submit" loading={busy}>
                    Record decision and send email
                  </LoadingButton>
                </div>
                {latestDecision && (
                  <p className="text-muted text-[0.9rem] my-1">
                    Recording a new decision replaces the current status; every decision stays in the audit log below.
                  </p>
                )}
              </form>
            ) : (
              <AlertBanner variant="info">
                This application is still a draft, so a decision cannot be recorded yet.
              </AlertBanner>
            )}
          </>
        )}
      </section>

      <section className="bg-white border border-border rounded-lg px-[1.4rem] py-5 shadow-sm [&_h2]:mt-0 [&_h2]:mb-[0.9rem] [&_h2]:text-[1.1rem] [&_h2]:text-navy-900 [&_h3]:mt-[1.1rem] [&_h3]:mb-1.5 [&_h3]:text-[0.95rem]" aria-labelledby="decision-history">
        <h2 id="decision-history">Decision history and email delivery</h2>
        {decisions.length === 0 ? (
          <p className="text-muted text-[0.9rem] my-1">No decisions recorded yet.</p>
        ) : (
          <>
            <p className="m-0 mb-4 px-[0.85rem] py-[0.7rem] bg-slate-50 border border-border rounded-lg text-[0.9rem] flex items-center justify-between gap-3 flex-wrap">
              Latest decision email: {emailStatusCopy(emailLog)}
              {showRetryEmail && (
                <LoadingButton loading={emailBusy} onClick={handleRetryEmail}>Retry email</LoadingButton>
              )}
            </p>
            <ol className="m-0 p-0 list-none grid gap-[0.9rem] [&_li]:border-t [&_li]:border-border [&_li]:pt-[0.9rem]">
              {decisions.map((entry) => (
                <li key={entry.id}>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={entry.decision} />
                    <span className="text-muted text-[0.9rem] my-1">{formatDateTime(entry.decidedAt)}</span>
                  </div>
                  <p className="mt-[0.45rem] text-[0.95rem] leading-[1.55]">{entry.message}</p>
                  <p className="text-muted text-[0.8rem] mt-1 mb-0">Recorded by {entry.decidedBy === user.uid ? "you" : entry.decidedBy}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
    </PortalShell>
  );
}
