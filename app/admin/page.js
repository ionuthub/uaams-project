// app/admin/page.js
// Route: /admin (issue #12 - build admin list view; US-07, FR-09, NFR-03).
//
// The shared query and Firestore rules both enforce university scoping.
// The queue renders inside the shared portal shell so admin matches the
// applicant portal look and navigation.

"use client";

import { useEffect, useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import StatusBadge from "../../components/StatusBadge";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth, getUserProfile, logout } from "../../lib/auth";
import { getApplicationsForUniversity, getUniversities } from "../../lib/db";
import styles from "./admin.module.css";

const ADMIN_NAV = [{ key: "queue", label: "Application queue", href: "/admin" }];
const ADMIN_FOOTER = [{ label: "Student view", href: "/student" }];

function formatDate(ts) {
  if (!ts) return "-";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminListPage() {
  const [phase, setPhase] = useState("loading"); // loading | signed-out | denied | error | ready
  const [profile, setProfile] = useState(null);
  const [universityName, setUniversityName] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    let active = true;
    let authRun = 0;
    let unsubscribe = () => {};

    function showLoadError(error) {
      console.error("Admin list failed to load:", error);
      if (active) setPhase("error");
    }

    try {
      unsubscribe = watchAuth(async (user) => {
        const run = ++authRun;
        const isCurrent = () => active && run === authRun;

        if (!user) {
          if (isCurrent()) {
            setProfile(null);
            setApplications([]);
            setPhase("signed-out");
          }
          return;
        }

        if (!isCurrent()) return;
        setPhase("loading");
        try {
          const userProfile = await getUserProfile(user.uid);
          if (!isCurrent()) return;
          if (
            !userProfile ||
            userProfile.role !== "admin" ||
            !userProfile.universityId
          ) {
            setProfile(null);
            setApplications([]);
            setPhase("denied");
            return;
          }

          const [apps, universities] = await Promise.all([
            getApplicationsForUniversity(userProfile.universityId),
            getUniversities(),
          ]);
          if (!isCurrent()) return;

          const university = universities.find(
            (item) => item.id === userProfile.universityId
          );
          setProfile(userProfile);
          setUniversityName(university ? university.name : userProfile.universityId);
          setApplications(apps);
          setPhase("ready");
        } catch (error) {
          if (isCurrent()) showLoadError(error);
        }
      });
    } catch (error) {
      showLoadError(error);
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Admin logout failed:", error);
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard title="Admissions">
        <p className={styles.muted} role="status">Loading your application queue...</p>
      </AuthCard>
    );
  }

  if (phase === "signed-out") {
    return (
      <AuthCard title="Admissions">
        <AlertBanner variant="error">
          You need to sign in with an admissions account to view this page.
        </AlertBanner>
        <p className={styles.muted}>
          <a className="text-link" href="/login">Go to login</a>
        </p>
      </AuthCard>
    );
  }

  if (phase === "denied") {
    return (
      <AuthCard title="Admissions">
        <AlertBanner variant="error">
          This area is only available to admissions officers. Your account
          does not have admin access.
        </AlertBanner>
        <LoadingButton loading={false} onClick={handleLogout}>Log out</LoadingButton>
      </AuthCard>
    );
  }

  if (phase === "error") {
    return (
      <AuthCard title="Admissions">
        <AlertBanner variant="error">
          The application queue could not be loaded. Check your connection
          and try again. If the problem continues, contact the project team.
        </AlertBanner>
        <LoadingButton loading={false} onClick={() => window.location.reload()}>
          Try again
        </LoadingButton>
      </AuthCard>
    );
  }

  return (
    <PortalShell
      user={{ displayName: profile.fullName, email: profile.email }}
      current="queue"
      nav={ADMIN_NAV}
      subtitle="Admissions"
      roleLabel="Admissions officer"
      footerLinks={ADMIN_FOOTER}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Admissions</p>
            <h1 className={styles.title}>Application queue</h1>
            <p className={styles.muted}>
              {universityName} — {profile.fullName} ({profile.email})
            </p>
          </div>
        </header>

        {applications.length === 0 ? (
          <AlertBanner variant="info">
            No submitted applications for {universityName} yet. New submissions
            appear here automatically, newest first.
          </AlertBanner>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>
                Applications submitted to {universityName}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Application</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Document</th>
                  <th scope="col"><span className={styles.srOnly}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td><span className={styles.appId}>{app.id}</span></td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>{formatDate(app.submittedAt)}</td>
                    <td>{app.documentPath ? "Attached" : "None"}</td>
                    <td>
                      <a className="text-link" href={`/admin/applications/${app.id}`}>View details</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
