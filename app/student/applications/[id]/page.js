// app/student/applications/[id]/page.js
// Route: /student/applications/{id}
//
// Read-only view of one of the signed-in student own applications. Closes the
// gap where a submitted application could not be read back: the dashboard card
// showed the status and decision message, but the answers the applicant typed
// were only visible to the admin. Firestore rules already allow a student to
// read their own application and its decision history, so this is front-end
// only. Nothing here can edit a submitted application.

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AuthCard from "../../../../components/auth/AuthCard";
import AlertBanner from "../../../../components/auth/AlertBanner";
import LoadingButton from "../../../../components/auth/LoadingButton";
import StatusBadge from "../../../../components/StatusBadge";
import PortalShell from "../../../../components/portal/PortalShell";
import { watchAuth } from "../../../../lib/auth";
import {
  getApplication,
  getDecisionHistory,
  withdrawApplication,
  WITHDRAWABLE_STATUSES,
} from "../../../../lib/db";
import { getDocumentUrl, DOC_TYPES } from "../../../../lib/storage";

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

const CARD = "bg-white border border-border rounded-[14px] px-7 py-5 shadow-sm [&_h2]:mt-0 [&_h2]:mb-[0.9rem] [&_h2]:text-[1.1rem] [&_h2]:text-navy-900 [&_h3]:mt-[1.1rem] [&_h3]:mb-1.5 [&_h3]:text-[0.95rem] max-sm:px-5";
const GRID = "grid grid-cols-2 gap-x-6 gap-y-3 m-0 max-sm:grid-cols-1 [&_dt]:text-[0.78rem] [&_dt]:uppercase [&_dt]:tracking-[0.04em] [&_dt]:text-quiet [&_dd]:mt-[0.15rem] [&_dd]:text-[0.95rem] [&_dd]:[overflow-wrap:anywhere]";
const MUTED = "text-muted text-[0.9rem] my-1";

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

export default function StudentApplicationDetailPage() {
  const params = useParams();
  const applicationId = typeof params?.id === "string" ? params.id : "";

  const [phase, setPhase] = useState("loading"); // loading | signed-out | unverified | not-found | error | ready
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [documentError, setDocumentError] = useState(null);

  // #194: withdrawing is the one action a student can take on a submitted
  // application, so it is deliberately behind a confirmation and cannot be
  // triggered by a single stray click.
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const confirmRef = useRef(null);

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
      if (!current.emailVerified) {
        if (isCurrent()) setPhase("unverified");
        return;
      }
      if (!isCurrent()) return;
      setPhase("loading");
      try {
        const record = await getApplication(applicationId);
        if (!isCurrent()) return;
        // Ownership check. The rules enforce this server-side as well.
        if (!record || record.studentUid !== current.uid) {
          setPhase("not-found");
          return;
        }
        let history = [];
        try {
          history = await getDecisionHistory(applicationId);
        } catch (error) {
          console.warn("Decision history unavailable:", error?.code || error?.message);
        }
        if (!isCurrent()) return;
        setUser(current);
        setApplication(record);
        setDecisions(history);
        setPhase("ready");
      } catch (error) {
        if (!isCurrent()) return;
        if (error?.code === "permission-denied") {
          setPhase("not-found");
          return;
        }
        console.error("Application detail failed to load:", error);
        setPhase("error");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [applicationId]);

  async function handleOpenDocument(path) {
    setDocumentError(null);
    try {
      const url = await getDocumentUrl(path);
      window.open(url, "_blank", "noopener");
    } catch (error) {
      console.error("Document open failed:", error);
      setDocumentError("The document could not be opened. Please try again later.");
    }
  }

  function openConfirm() {
    setWithdrawError(null);
    // showModal gives focus trapping and Escape-to-close for free, which a
    // hand-rolled overlay would have to reimplement.
    confirmRef.current?.showModal();
  }

  async function handleWithdraw() {
    setWithdrawError(null);
    setWithdrawing(true);
    try {
      await withdrawApplication(application.id);
      confirmRef.current?.close();
      // Reflect the new state without a reload; the record is unchanged
      // apart from its status, so refetching the whole thing is wasteful.
      setApplication((prev) => ({ ...prev, status: "withdrawn" }));
    } catch (error) {
      console.error("Withdraw failed:", error);
      const code = error?.code || error?.message;
      if (code === "ALREADY_WITHDRAWN") {
        setWithdrawError("This application has already been withdrawn.");
      } else if (code === "NOT_WITHDRAWABLE") {
        setWithdrawError("This application can no longer be withdrawn.");
      } else if (code === "permission-denied") {
        setWithdrawError("You do not have permission to withdraw this application.");
      } else {
        setWithdrawError("The application could not be withdrawn. Please try again.");
      }
    } finally {
      setWithdrawing(false);
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard title="Your application">
        <p className={MUTED} role="status">Loading your application...</p>
      </AuthCard>
    );
  }
  if (phase === "signed-out") {
    return (
      <AuthCard title="Your application">
        <AlertBanner variant="error">Sign in to view your application.</AlertBanner>
        <p className={MUTED}><a className="text-link" href="/login">Go to login</a></p>
      </AuthCard>
    );
  }
  if (phase === "unverified") {
    return (
      <AuthCard title="Your application">
        <AlertBanner variant="info">Verify your email to view your application.</AlertBanner>
        <p className={MUTED}><a className="text-link" href="/verify-email">Verification help</a></p>
      </AuthCard>
    );
  }
  if (phase === "not-found") {
    return (
      <AuthCard title="Your application">
        <AlertBanner variant="error">This application does not exist, or it is not yours.</AlertBanner>
        <p className={MUTED}><a className="text-link" href="/student">Back to my applications</a></p>
      </AuthCard>
    );
  }
  if (phase === "error") {
    return (
      <AuthCard title="Your application">
        <AlertBanner variant="error">We could not load this application. Please try again.</AlertBanner>
        <LoadingButton loading={false} onClick={() => window.location.reload()}>Try again</LoadingButton>
      </AuthCard>
    );
  }

  const university = application.form?.universityName || application.universityId;
  const isDraft = application.status === "draft";
  const isWithdrawn = application.status === "withdrawn";
  const canWithdraw = WITHDRAWABLE_STATUSES.includes(application.status);
  const courseName = application.form?.courseName;

  return (
    <PortalShell user={user} current="dashboard">
      <div className="max-w-[860px] mx-auto my-10 px-4 pb-16 grid gap-5">
        <header className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <p className="mt-0 mb-1.5 text-[0.85rem] text-muted">
              <a className="text-link font-medium" href="/student"><span aria-hidden="true">&larr;</span> My applications</a> /{" "}
              <span className="font-mono text-[0.85rem] text-muted [overflow-wrap:anywhere]">{application.id}</span>
            </p>
            <h1 className="mt-0 mb-1 text-2xl text-navy-900 font-editorial">{university}</h1>
            <p className={MUTED}>Submitted {formatDateTime(application.submittedAt)}</p>
          </div>
          <StatusBadge status={application.status} />
        </header>

        {isDraft && (
          <AlertBanner variant="info">
            This application is still a draft and has not been submitted yet.
          </AlertBanner>
        )}

        {isWithdrawn && (
          <AlertBanner variant="info">
            You withdrew this application. It is no longer being considered by the
            university, and the record is kept for your reference.
          </AlertBanner>
        )}

        {application.latestDecisionMessage && (
          <section className={CARD} aria-labelledby="decision-message">
            <h2 id="decision-message">Message from the university</h2>
            <p className="m-0 text-[0.95rem] leading-relaxed whitespace-pre-wrap">{application.latestDecisionMessage}</p>
          </section>
        )}

        <section className={CARD} aria-labelledby="application-summary">
          <h2 id="application-summary">Summary</h2>
          <dl className={GRID}>
            <div><dt>University</dt><dd>{university}</dd></div>
            <div><dt>Status</dt><dd>{application.status}</dd></div>
            <div><dt>Submitted</dt><dd>{formatDateTime(application.submittedAt)}</dd></div>
            <div><dt>Last updated</dt><dd>{formatDateTime(application.updatedAt)}</dd></div>
          </dl>
        </section>

        <section className={CARD} aria-labelledby="your-answers">
          <h2 id="your-answers">What you submitted</h2>
          <dl className={GRID}>
            {FORM_FIELDS.map(([key, label]) => (
              <div key={key}><dt>{label}</dt><dd>{application.form?.[key] || "-"}</dd></div>
            ))}
          </dl>
          <h3>Personal statement</h3>
          <p className="m-0 text-[0.95rem] leading-relaxed whitespace-pre-wrap">{application.form?.personalStatement || "-"}</p>
        </section>

        <section className={CARD} aria-labelledby="your-document">
          <h2 id="your-document">Supporting documents</h2>
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
              <p className={MUTED}>{application.documentPath.split("/").pop()}</p>
              <LoadingButton loading={false} full={false} onClick={() => handleOpenDocument(application.documentPath)}>View document</LoadingButton>
            </>
          ) : (
            <p className={MUTED}>No documents are attached to this application.</p>
          )}
          {documentError && <AlertBanner variant="error">{documentError}</AlertBanner>}
        </section>

        {decisions.length > 0 && (
          <section className={CARD} aria-labelledby="decision-history">
            <h2 id="decision-history">Decision history</h2>
            <ol className="m-0 p-0 list-none grid gap-[0.9rem] [&_li]:border-t [&_li]:border-border [&_li]:pt-[0.9rem]">
              {decisions.map((entry) => (
                <li key={entry.id}>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={entry.decision} />
                    <span className={MUTED}>{formatDateTime(entry.decidedAt)}</span>
                  </div>
                  <p className="mt-[0.45rem] text-[0.95rem] leading-[1.55]">{entry.message}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {canWithdraw && (
          <section className={CARD} aria-labelledby="withdraw-heading">
            <h2 id="withdraw-heading">Withdraw this application</h2>
            <p className={MUTED}>
              If you no longer want {university} to consider this application, you can
              withdraw it. The application and its history are kept, but the university
              stops reviewing it. This cannot be undone.
            </p>
            {withdrawError && <AlertBanner variant="error">{withdrawError}</AlertBanner>}
            <LoadingButton loading={false} full={false} onClick={openConfirm}>
              Withdraw application
            </LoadingButton>
          </section>
        )}

        <dialog
          ref={confirmRef}
          aria-labelledby="withdraw-confirm-title"
          className="border border-border rounded-[14px] p-0 max-w-[460px] backdrop:bg-black/40"
        >
          <div className="px-7 py-6 grid gap-4">
            <h2 id="withdraw-confirm-title" className="m-0 text-[1.1rem] text-navy-900">
              Withdraw this application?
            </h2>
            <p className="m-0 text-[0.95rem] leading-relaxed">
              You are about to withdraw your application to <strong>{university}</strong>
              {courseName ? <> for <strong>{courseName}</strong></> : null}. The university
              will stop reviewing it and <strong>this cannot be undone</strong>. You would
              need to start a new application to apply again.
            </p>
            {withdrawError && <AlertBanner variant="error">{withdrawError}</AlertBanner>}
            <div className="flex gap-3 flex-wrap">
              <LoadingButton loading={withdrawing} full={false} onClick={handleWithdraw}>
                {withdrawing ? "Withdrawing..." : "Yes, withdraw it"}
              </LoadingButton>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => confirmRef.current?.close()}
                disabled={withdrawing}
              >
                Keep my application
              </button>
            </div>
          </div>
        </dialog>

        <p className="m-0">
          {isDraft ? (
            <a className="button button-primary" href="/apply">Continue application</a>
          ) : (
            <a className="text-link" href="/student">Back to my applications</a>
          )}
        </p>
      </div>
    </PortalShell>
  );
}
