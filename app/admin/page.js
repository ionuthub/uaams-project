// app/admin/page.js
// Route: /admin (issue #12 - build admin list view; US-07, FR-09, NFR-03).
//
// Admin application list, scoped to the signed-in admin's university.
// Scoping is enforced twice: the shared query filters by universityId
// (lib/db.js getApplicationsForUniversity) and firestore.rules deny
// out-of-scope reads independently, so this page cannot widen access.
//
// Detail navigation: each row exposes a "View details" action pointing at
// /admin/applications/{id}. It stays disabled until #13 lands (Week 3) -
// flip DETAIL_ROUTE_READY when that route exists.
//
// Sprint 3 ERD note: if applications later gain courseId / financeStatus
// (evolved ERD), the row shows them automatically when present; nothing
// here breaks while they are absent.

"use client";

import { useEffect, useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import StatusBadge from "../../components/StatusBadge";
import { watchAuth, getUserProfile, logout } from "../../lib/auth";
import { getApplicationsForUniversity, getUniversities } from "../../lib/db";
import styles from "./admin.module.css";

const DETAIL_ROUTE_READY = false; // flip when #13 (admin detail view) merges

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
    const unsubscribe = watchAuth(async (user) => {
      if (!user) {
        setPhase("signed-out");
        return;
      }
      try {
        const userProfile = await getUserProfile(user.uid);
        if (!userProfile || userProfile.role !== "admin" || !userProfile.universityId) {
          // Not an admissions officer - firestore.rules would deny the
          // scoped query anyway; we simply don't attempt it (NFR-03).
          setPhase("denied");
          return;
        }
        setProfile(userProfile);
        const [apps, universities] = await Promise.all([
          getApplicationsForUniversity(userProfile.universityId),
          getUniversities(),
        ]);
        const uni = universities.find((u) => u.id === userProfile.universityId);
        setUniversityName(uni ? uni.name : userProfile.universityId);
        setApplications(apps);
        setPhase("ready");
      } catch (err) {
        console.error("Admin list failed to load:", err);
        setPhase("error");
      }
    });
    return unsubscribe;
  }, []);

  async function handleLogout() {
    await logout();
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
          <a href="/login">Go to login</a>
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
          and try again; if it keeps failing, report it with the time and
          your account on issue #12.
        </AlertBanner>
        <LoadingButton loading={false} onClick={() => window.location.reload()}>
          Try again
        </LoadingButton>
      </AuthCard>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Application queue</h1>
          <p className={styles.muted}>
            {universityName} - signed in as {profile.fullName} ({profile.email})
          </p>
        </div>
        <LoadingButton loading={false} onClick={handleLogout}>Log out</LoadingButton>
      </header>

      {applications.length === 0 ? (
        <AlertBanner variant="info">
          No submitted applications for {universityName} yet. New submissions
          appear here automatically, newest first.
        </AlertBanner>
      ) : (
        <table className={styles.table}>
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
                <td>
                  <span className={styles.appId}>{app.id}</span>
                  {app.courseId ? (
                    <span className={styles.muted}> - course {app.courseId}</span>
                  ) : null}
                </td>
                <td>
                  <StatusBadge status={app.status} />
                  {app.financeStatus ? (
                    <span className={styles.muted}> finance: {app.financeStatus}</span>
                  ) : null}
                </td>
                <td>{formatDate(app.submittedAt)}</td>
                <td>{app.documentPath ? "Attached" : "None"}</td>
                <td>
                  {DETAIL_ROUTE_READY ? (
                    <a href={`/admin/applications/${app.id}`}>View details</a>
                  ) : (
                    <span
                      className={styles.muted}
                      title="Detail view arrives with issue #13 in Week 3"
                    >
                      Details - Week 3 (#13)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
