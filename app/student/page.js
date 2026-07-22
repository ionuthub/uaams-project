"use client";

import { useEffect, useState } from "react";
import AlertBanner from "../../components/auth/AlertBanner";
import AuthCard from "../../components/auth/AuthCard";
import LoadingButton from "../../components/auth/LoadingButton";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth } from "../../lib/auth";
import { getStudentApplications } from "../../lib/db";
import styles from "./student.module.css";

const STATUS_META = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  offer: { label: "Offer", tone: "success" },
  rejected: { label: "Not successful", tone: "error" },
};

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = watchAuth(async (current) => {
      if (!active) return;
      if (!current) {
        setPhase("signed-out");
        return;
      }
      if (!current.emailVerified) {
        setPhase("unverified");
        return;
      }
      setUser(current);
      try {
        setApplications(await getStudentApplications(current.uid));
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
    <PortalShell user={user} current="dashboard">
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Applicant portal</p>
            <h1>My applications</h1>
            <p className={styles.lead}>Track your drafts, submissions and university decisions in one place.</p>
          </div>
          <a className="button button-primary" href="/apply">New application</a>
        </header>

        {applications.length === 0 ? (
          <section className={styles.empty}>
            <span className={styles.emptySeal}>U</span>
            <h2>No applications yet</h2>
            <p>Choose a university and create your first application. You can save a draft and return to it any time.</p>
            <a className="button button-primary" href="/apply">Start an application</a>
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
                    <span className={"status status-" + meta.tone}>{meta.label}</span>
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
                    <a className="button button-secondary" href="/apply">Open application</a>
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
    </PortalShell>
  );
}
