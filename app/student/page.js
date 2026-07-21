"use client";

import { useEffect, useState } from "react";
import AlertBanner from "../../components/auth/AlertBanner";
import AuthCard from "../../components/auth/AuthCard";
import LoadingButton from "../../components/auth/LoadingButton";
import { logout, watchAuth } from "../../lib/auth";
import { getStudentApplications } from "../../lib/db";
import styles from "./student.module.css";

// Human labels + visual tone for each real application status. No status here
// is invented: it always reflects the value stored on the application.
const STATUS_META = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  offer: { label: "Offer", tone: "success" },
  rejected: { label: "Not successful", tone: "rejected" },
};

// The four journey stages and, per real status, whether each stage is done,
// current or upcoming. Derived only from the stored status.
const STAGES = ["Draft", "Submitted", "Under review", "Decision"];
const JOURNEY = {
  draft: ["current", "upcoming", "upcoming", "upcoming"],
  submitted: ["done", "current", "upcoming", "upcoming"],
  under_review: ["done", "done", "current", "upcoming"],
  offer: ["done", "done", "done", "done"],
  rejected: ["done", "done", "done", "current"],
};

function formatDate(value) {
  if (!value) return "Not submitted";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not submitted" : date.toLocaleDateString("en-GB");
}

export default function StudentDashboardPage() {
  const [phase, setPhase] = useState("loading");
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    let active = true;
    const unsubscribe = watchAuth(async (user) => {
      if (!active) return;
      if (!user) {
        setPhase("signed-out");
        return;
      }
      if (!user.emailVerified) {
        setPhase("unverified");
        return;
      }
      try {
        setApplications(await getStudentApplications(user.uid));
        if (active) setPhase("ready");
      } catch (error) {
        console.error("Student dashboard failed to load:", error);
        if (active) setPhase("error");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (phase === "loading") return <AuthCard title="My applications"><p role="status">Loading your applications...</p></AuthCard>;
  if (phase === "signed-out") return <AuthCard title="My applications"><AlertBanner variant="error">Sign in to view your applications.</AlertBanner><a href="/login">Go to login</a></AuthCard>;
  if (phase === "unverified") return <AuthCard title="Verify your email"><AlertBanner variant="info">Verify your email before starting an application.</AlertBanner><a href="/verify-email">Verification help</a></AuthCard>;
  if (phase === "error") return <AuthCard title="My applications"><AlertBanner variant="error">We could not load your applications. Please try again.</AlertBanner><LoadingButton loading={false} onClick={() => window.location.reload()}>Try again</LoadingButton></AuthCard>;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Applicant portal</p>
            <h1>My applications</h1>
            <p className={styles.lead}>Track your drafts, submissions and university decisions in one place.</p>
          </div>
          <div className={styles.headerActions}>
            <a className={styles.buttonPrimary} href="/apply">New application</a>
            <button className={styles.textButton} type="button" onClick={() => logout()}>Log out</button>
          </div>
        </header>

        {applications.length === 0 ? (
          <section className={styles.empty}>
            <span className={styles.emptySeal}>U</span>
            <h2>No applications yet</h2>
            <p>Choose a university and create your first application. You can save a draft and return to it any time.</p>
            <a className={styles.buttonPrimary} href="/apply">Start an application</a>
          </section>
        ) : (
          <section className={styles.stack} aria-label="Your applications">
            {applications.map((application) => {
              const meta = STATUS_META[application.status] || { label: application.status, tone: "neutral" };
              const states = JOURNEY[application.status] || JOURNEY.draft;
              const university = application.form?.universityName || "University application";
              const seal = university.trim().slice(0, 2).toUpperCase();
              return (
                <article className={styles.record} key={application.id}>
                  <div className={styles.recordHeader}>
                    <div className={styles.identity}>
                      <span className={styles.seal}>{seal}</span>
                      <div>
                        <p className={styles.microLabel}>Application</p>
                        <h2>{university}</h2>
                        <p className={styles.reference}>Reference {application.id}</p>
                      </div>
                    </div>
                    <span className={styles.status + " " + styles["status_" + meta.tone]}>{meta.label}</span>
                  </div>

                  <ol className={styles.journey} aria-label="Application progress">
                    {STAGES.map((stage, index) => {
                      const state = states[index];
                      const dot = state === "done" ? "✓" : index + 1;
                      return (
                        <li key={stage} className={styles[state]}>
                          <span className={styles.dot}>{dot}</span>
                          <strong>{stage}</strong>
                          {index === 3 && application.status === "offer" && <small>Offer made</small>}
                          {index === 3 && application.status === "rejected" && <small>Not successful</small>}
                        </li>
                      );
                    })}
                  </ol>

                  <div className={styles.recordFooter}>
                    <dl className={styles.meta}>
                      <div><dt>Submitted</dt><dd>{formatDate(application.submittedAt)}</dd></div>
                      <div><dt>Document</dt><dd>{application.documentPath ? "Attached" : "Not attached"}</dd></div>
                    </dl>
                    <a className={styles.buttonSecondary} href="/apply">Open application</a>
                  </div>

                  {application.latestDecisionMessage && (
                    <div className={styles.decision}>
                      <p className={styles.microLabel}>Message from the university</p>
                      <p>{application.latestDecisionMessage}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
