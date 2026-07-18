"use client";

import { useEffect, useState } from "react";
import AlertBanner from "../../components/auth/AlertBanner";
import AuthCard from "../../components/auth/AuthCard";
import LoadingButton from "../../components/auth/LoadingButton";
import StatusBadge from "../../components/StatusBadge";
import { logout, watchAuth } from "../../lib/auth";
import { getStudentApplications } from "../../lib/db";
import styles from "./student.module.css";

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
      <header className={styles.header}>
        <div><h1>My applications</h1><p>Track drafts, submissions and university decisions.</p></div>
        <div className={styles.actions}><a className={styles.primaryLink} href="/apply">Start an application</a><button className={styles.textButton} onClick={() => logout()}>Log out</button></div>
      </header>
      {applications.length === 0 ? (
        <section className={styles.empty}><h2>No applications yet</h2><p>Choose a university and create your first application.</p><a className={styles.primaryLink} href="/apply">Start an application</a></section>
      ) : (
        <section className={styles.grid} aria-label="Your applications">
          {applications.map((application) => (
            <article className={styles.card} key={application.id}>
              <div className={styles.cardHeader}><h2>{application.form?.universityName || "University application"}</h2><StatusBadge status={application.status} /></div>
              <dl><div><dt>Application ID</dt><dd>{application.id}</dd></div><div><dt>Submitted</dt><dd>{formatDate(application.submittedAt)}</dd></div><div><dt>Document</dt><dd>{application.documentPath ? "Attached" : "Not attached"}</dd></div></dl>
              {application.latestDecisionMessage && <AlertBanner variant="info">{application.latestDecisionMessage}</AlertBanner>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
