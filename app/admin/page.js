// app/admin/page.js
// Route: /admin (issue #12 - build admin list view; US-07, FR-09, NFR-03).
//
// Queue renders inside the shared portal shell. Styling is Tailwind utilities
// (migrated from admin.module.css); mobile-first, with the two lower-priority
// columns hidden on small screens.

"use client";

import { useEffect, useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import StatusBadge from "../../components/StatusBadge";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth, getUserProfile, logout } from "../../lib/auth";
import { getApplicationsForUniversity, getUniversities } from "../../lib/db";

const ADMIN_NAV = [
  { key: "home", label: "Home", href: "/" },
  {
    key: "admin-dashboard",
    label: "Dashboard",
    children: [{ key: "queue", label: "Application queue", href: "/admin" }],
  },
];

const ADMIN_FOOTER = [{ label: "Student view", href: "/student" }];

const TH = "text-left text-[0.8rem] uppercase tracking-[0.04em] text-quiet bg-slate-50 px-[0.9rem] py-[0.6rem] border-b border-border max-sm:p-[0.6rem]";
const TD = "px-[0.9rem] py-[0.7rem] border-b border-border align-middle text-[0.95rem] text-ink max-sm:p-[0.6rem]";
const TH_HIDE = TH + " max-sm:hidden";
const TD_HIDE = TD + " max-sm:hidden";

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
        <p className="text-muted text-[0.9rem]" role="status">Loading your application queue...</p>
      </AuthCard>
    );
  }

  if (phase === "signed-out") {
    return (
      <AuthCard title="Admissions">
        <AlertBanner variant="error">
          You need to sign in with an admissions account to view this page.
        </AlertBanner>
        <p className="text-muted text-[0.9rem]">
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
      <div className="max-w-[960px] mx-auto my-10 px-4">
        <header className="flex justify-between items-start gap-4 mb-6 flex-wrap">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Admissions</p>
            <h1 className="mt-0 mb-1 text-2xl text-navy-900 font-editorial">Application queue</h1>
            <p className="text-muted text-[0.9rem] m-0">
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
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse bg-white border border-border rounded-lg overflow-hidden shadow-sm max-sm:min-w-0 max-sm:table-fixed">
              <caption className="sr-only">
                Applications submitted to {universityName}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={TH}>Application</th>
                  <th scope="col" className={TH}>Status</th>
                  <th scope="col" className={TH_HIDE}>Submitted</th>
                  <th scope="col" className={TH_HIDE}>Document</th>
                  <th scope="col" className={TH}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-100">
                    <td className={TD}><span className="font-mono text-[0.85rem] text-muted [overflow-wrap:anywhere]">{app.id}</span></td>
                    <td className={TD}><StatusBadge status={app.status} /></td>
                    <td className={TD_HIDE}>{formatDate(app.submittedAt)}</td>
                    <td className={TD_HIDE}>{app.documentPath ? "Attached" : "None"}</td>
                    <td className={TD}>
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
