"use client";
// app/dashboard/page.js
// Issue #9 - student dashboard with understandable status badges.
// Reads real data via lib/db.js and lib/auth.js. "New application" (#10)
// is disabled with the real reason instead of pointing at a page that
// doesn't exist yet; the same applies to document upload (#11, blocked
// on the Storage decision, #6).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth, getUserProfile, logout } from "../../lib/auth";
import { getStudentApplications, getUniversities } from "../../lib/db";
import StatusBadge from "../../components/StatusBadge";
import ApplicationTimeline from "../../components/dashboard/ApplicationTimeline";
import styles from "./dashboard.module.css";

const NEXT_STEP_COPY = {
  draft: "Continue and submit your application when it's ready.",
  submitted: "Your application is submitted. The university will begin reviewing it shortly.",
  under_review: "The admissions team is reviewing your application. No action is needed from you right now.",
  offer: "You have a decision on this application. Read the message below.",
  rejected: "A decision has been made on this application. Read the message below.",
};

export default function DashboardPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState("loading"); // loading | ready
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState(null); // null = loading, [] = empty
  const [universities, setUniversities] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = watchAuth(async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!user.emailVerified) {
        router.replace("/verify-email");
        return;
      }
      setAuthState("ready");
      try {
        const [profileData, apps, unis] = await Promise.all([
          getUserProfile(user.uid),
          getStudentApplications(user.uid),
          getUniversities(),
        ]);
        setProfile(profileData);
        setApplications(apps);
        const map = {};
        unis.forEach((u) => { map[u.id] = u.name; });
        setUniversities(map);
      } catch (e) {
        setError(e.message || "Something went wrong loading your dashboard.");
      }
    });
    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  if (authState === "loading") {
    return (
      <main className={styles.page}>
        <p role="status">Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.brand}>UAAMS</span>
        <button type="button" className={styles.signOut} onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Applicant portal</p>
          <h1>Welcome back{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}</h1>
          <p className={styles.subtitle}>
            {applications === null
              ? "Loading your applications..."
              : applications.length === 0
              ? "You haven't started an application yet."
              : `You have ${applications.length} application${applications.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <button
          type="button"
          className={styles.newApplicationButton}
          disabled
          title="Course selection (issue #10) is still being built"
          aria-describedby="new-application-note"
        >
          New application
        </button>
      </div>
      <p id="new-application-note" className={styles.disabledNote}>
        Starting a new application will be available once the application-form steps (issue #10) are live.
      </p>

      {error && (
        <div className={styles.errorState} role="alert">
          <h2>We could not load your applications</h2>
          <p>{error}</p>
        </div>
      )}

      {!error && applications !== null && applications.length === 0 && (
        <div className={styles.emptyState}>
          <h2>No applications yet</h2>
          <p>Once you start an application, its status will appear here.</p>
        </div>
      )}

      {!error && applications !== null && applications.length > 0 && (
        <ul className={styles.applicationList} aria-live="polite">
          {applications.map((app) => (
            <li key={app.id} className={styles.applicationCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.eyebrow}>{universities[app.universityId] || "University"}</p>
                  <h2>Application {app.id.slice(0, 8)}</h2>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <ApplicationTimeline status={app.status} />

              <p className={styles.nextStep}>{NEXT_STEP_COPY[app.status] || "Check back for updates."}</p>

              {(app.status === "offer" || app.status === "rejected") && app.latestDecisionMessage && (
                <div className={styles.decisionMessage}>
                  <p className={styles.eyebrow}>Message from the university</p>
                  <p>{app.latestDecisionMessage}</p>
                </div>
              )}

              <p className={styles.documentNote}>
                Document upload (issue #11) is on hold until the team's Storage decision (issue #6) is resolved.
                {app.documentPath ? " A document has already been uploaded via the backend test harness." : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
