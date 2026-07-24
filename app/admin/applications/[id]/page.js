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
} from "../../../../lib/db";
import { getDocumentUrl } from "../../../../lib/storage";
import PortalShell from "../../../../components/portal/PortalShell";
import styles from "./detail.module.css";

const FORM_FIELDS = [
  ["fullName", "Full name"],
  ["dateOfBirth", "Date of birth"],
  ["nationality", "Nationality"],
  ["phone", "Phone"],
  ["address", "Address"],
  ["previousQualification", "Previous qualification"],
  ["studyLevel", "Intended study level"],
  ["intake", "Intake"],
];

const ADMIN_NAV = [{ key: "queue", label: "Application queue", href: "/admin" }];
const ADMIN_FOOTER = [{ label: "Student view", href: "/student" }];

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

  async function handleDecision(event) {
    event.preventDefault();
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

  async function handleOpenDocument() {
    setDocumentError(null);
    try {
      const url = await getDocumentUrl(application.documentPath);
      window.open(url, "_blank", "noopener");
    } catch (error) {
      console.error("Document open failed:", error);
      setDocumentError("The document could not be opened. Storage may not be enabled yet, or access was denied.");
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard title="Application detail">
        <p className={styles.muted} role="status">Loading the application...</p>
      </AuthCard>
    );
  }
  if (phase === "signed-out") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">Sign in with an admissions account to view this application.</AlertBanner>
        <p className={styles.muted}><a href="/login">Go to login</a></p>
      </AuthCard>
    );
  }
  if (phase === "denied") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">This area is only available to admissions officers.</AlertBanner>
        <p className={styles.muted}><a href="/">Back to the homepage</a></p>
      </AuthCard>
    );
  }
  if (phase === "not-found") {
    return (
      <AuthCard title="Application detail">
        <AlertBanner variant="error">
          This application does not exist or is not part of your university's queue.
        </AlertBanner>
        <p className={styles.muted}><a href="/admin">Back to the application queue</a></p>
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
  const decidable = ["submitted", "under_review", "offer", "rejected"].includes(application.status);
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
      <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}><a href="/admin">Application queue</a> / <span className={styles.appId}>{application.id}</span></p>
          <h1 className={styles.title}>Application detail</h1>
          <p className={styles.muted}>Signed in as {profile.fullName} ({profile.email})</p>
        </div>
        <StatusBadge status={application.status} />
      </header>

      {notice && <AlertBanner variant={notice.type}>{notice.text}</AlertBanner>}

      <section className={styles.card} aria-labelledby="application-summary">
        <h2 id="application-summary">Summary</h2>
        <dl className={styles.grid}>
          <div><dt>University</dt><dd>{application.form?.universityName || application.universityId}</dd></div>
          <div><dt>Submitted</dt><dd>{formatDateTime(application.submittedAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDateTime(application.updatedAt)}</dd></div>
          <div><dt>Student ID</dt><dd className={styles.appId}>{application.studentUid}</dd></div>
        </dl>
      </section>

      <section className={styles.card} aria-labelledby="applicant-details">
        <h2 id="applicant-details">Applicant details</h2>
        <dl className={styles.grid}>
          {FORM_FIELDS.map(([key, label]) => (
            <div key={key}><dt>{label}</dt><dd>{application.form?.[key] || "-"}</dd></div>
          ))}
        </dl>
        <h3>Personal statement</h3>
        <p className={styles.statement}>{application.form?.personalStatement || "-"}</p>
      </section>

      <section className={styles.card} aria-labelledby="supporting-document">
        <h2 id="supporting-document">Supporting document</h2>
        {application.documentPath ? (
          <>
            <p className={styles.muted}>{application.documentPath.split("/").pop()}</p>
            <LoadingButton loading={false} onClick={handleOpenDocument}>View document</LoadingButton>
            {documentError && <AlertBanner variant="error">{documentError}</AlertBanner>}
          </>
        ) : (
          <p className={styles.muted}>No document is attached to this application.</p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="record-decision">
        <h2 id="record-decision">Record a decision</h2>
        {decidable ? (
          <form onSubmit={handleDecision} noValidate>
            <fieldset className={styles.choices}>
              <legend>Decision</legend>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="decision"
                  value="offer"
                  checked={choice === "offer"}
                  onChange={() => { setChoice("offer"); setFormErrors((prev) => ({ ...prev, choice: null })); }}
                />
                Offer a place
              </label>
              <label className={styles.choice}>
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
            {formErrors.choice && <p className={styles.error} role="alert">{formErrors.choice}</p>}

            <label className={styles.label} htmlFor="decision-message">Message to the student</label>
            <textarea
              id="decision-message"
              rows="5"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setFormErrors((prev) => (prev.message ? { ...prev, message: null } : prev));
              }}
              aria-invalid={!!formErrors.message}
              placeholder="This message is included in the decision email and shown on the student's dashboard."
            />
            {formErrors.message && <p className={styles.error} role="alert">{formErrors.message}</p>}

            <div className={styles.actions}>
              <LoadingButton type="submit" loading={busy}>
                Record decision and send email
              </LoadingButton>
            </div>
            {latestDecision && (
              <p className={styles.muted}>
                Recording a new decision replaces the current status; every decision stays in the audit log below.
              </p>
            )}
          </form>
        ) : (
          <AlertBanner variant="info">
            This application is still a draft, so a decision cannot be recorded yet.
          </AlertBanner>
        )}
      </section>

      <section className={styles.card} aria-labelledby="decision-history">
        <h2 id="decision-history">Decision history and email delivery</h2>
        {decisions.length === 0 ? (
          <p className={styles.muted}>No decisions recorded yet.</p>
        ) : (
          <>
            <p className={styles.emailStatus}>
              Latest decision email: {emailStatusCopy(emailLog)}
              {showRetryEmail && (
                <LoadingButton loading={emailBusy} onClick={handleRetryEmail}>Retry email</LoadingButton>
              )}
            </p>
            <ol className={styles.history}>
              {decisions.map((entry) => (
                <li key={entry.id}>
                  <div className={styles.historyHead}>
                    <StatusBadge status={entry.decision} />
                    <span className={styles.muted}>{formatDateTime(entry.decidedAt)}</span>
                  </div>
                  <p className={styles.historyMessage}>{entry.message}</p>
                  <p className={styles.mutedSmall}>Recorded by {entry.decidedBy === user.uid ? "you" : entry.decidedBy}</p>
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
