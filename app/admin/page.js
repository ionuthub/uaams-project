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
import {
  getApplicationsForUniversity,
  getUniversities,
  getNotifications,
  markNotificationRead,
} from "../../lib/db";

const ADMIN_NAV = [
  { key: "home", label: "Home", href: "/" },
  {
    key: "admin-dashboard",
    label: "Dashboard",
    children: [{ key: "queue", label: "Application queue", href: "/admin" }],
  },
];

// #196: the Student view link is gone. Staff accounts are not applicant
// accounts, so the admin portal no longer offers a route into the student
// area - an admin following it would only ever see an empty dashboard.
// "Invite a colleague" sits beside Privacy on purpose (#195): administrative
// work rather than part of the daily queue, so it is present without competing
// with the applications an officer came here to review.
//
// It is only rendered inside the admin portal, behind the staff sign-in. There
// is deliberately no route to admin account creation from any public page - a
// visible one would let anyone reach it, and a flaw in the gate would hand a
// stranger access to applicant passports and addresses.
const ADMIN_FOOTER = [
  { label: "Privacy", href: "/privacy" },
  { label: "Invite a colleague", href: "/admin/invite" },
];

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
  const [notifications, setNotifications] = useState([]);
  // Issue #153 (PRD 4.3.1): status filter, name/ID search, paginated list.
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

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

          const [apps, universities, notices] = await Promise.all([
            getApplicationsForUniversity(userProfile.universityId),
            getUniversities(),
            // The queue must still load if notifications cannot (#194); the
            // panel simply stays hidden.
            getNotifications(user.uid).catch(() => []),
          ]);
          if (!isCurrent()) return;

          const university = universities.find(
            (item) => item.id === userProfile.universityId
          );
          setProfile(userProfile);
          setUniversityName(university ? university.name : userProfile.universityId);
          setApplications(apps);
          setNotifications(notices);
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

  async function handleMarkRead(notificationId) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((n) => (n.id === notificationId ? { ...n, readStatus: true } : n))
      );
    } catch (error) {
      console.error("Mark notification read failed:", error);
    }
  }

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
          <a className="text-link" href="/admin/login">Go to staff sign-in</a>
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

  const navWithCounts = ADMIN_NAV.map((item) =>
    item.children
      ? {
          ...item,
          children: item.children.map((child) =>
            child.key === "queue"
              ? {
                        ...child,
                        // Matches the default "All active" view this links to.
                        // Counting withdrawn here made the sidebar read 22
                        // beside a queue showing 19.
                        badge:
                          applications.filter((a) => a.status !== "withdrawn")
                            .length || null,
                      }
              : child
          ),
        }
      : item
  );

  const q = query.trim().toLowerCase();
  const filtered = applications.filter(
    (a) =>
      (statusFilter === "all" ? a.status !== "withdrawn" : a.status === statusFilter) &&
      (!q ||
        a.id.toLowerCase().includes(q) ||
        (a.form?.fullName || "").toLowerCase().includes(q))
  );
  const visible = filtered.slice(0, visibleCount);
  const FILTERS = [
    ["all", "All active"],
    ["submitted", "Submitted"],
    ["under_review", "Under review"],
    ["offer", "Offer"],
    ["rejected", "Rejected"],
  // #194: withdrawn sits OFF the pipeline. Submitted, under review, offer and
  // rejected are stages of staff work; withdrawn is the applicant stepping out
  // of it, and nobody ever actions one. So it is deliberately excluded from the
  // default "All active" view and reachable only by choosing it, rather than
  // being scattered through a queue an officer is trying to work through.
  // It is also absent from the open and decided figures, so a withdrawal never
  // counts as workload or as a decision.
  ["withdrawn", "Withdrawn"],
  ];

  return (
    <PortalShell
      user={{ displayName: profile.fullName, email: profile.email }}
      current="queue"
      nav={navWithCounts}
      subtitle="Admissions"
      roleLabel="Admissions officer"
      footerLinks={ADMIN_FOOTER}
    >
      <div className="max-w-[960px] mx-auto my-10 px-4">
        <header className="flex justify-between items-start gap-4 mb-6 flex-wrap">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Admissions</p>
            <h1 className="mt-0 mb-1 text-2xl text-navy-900 font-editorial">Admissions overview</h1>
            <p className="text-muted text-[0.9rem] m-0">
              Operational workload and application progress for {universityName}. Signed in as {profile.fullName} ({profile.email}).
            </p>
          </div>
          <a className="button button-primary" href="#queue">Open queue</a>
        </header>

        {notifications.length > 0 && (() => {
          const unreadCount = notifications.filter((n) => !n.readStatus).length;
          return (
            <section className="mb-6 border border-border rounded-[14px] bg-white shadow-sm px-6 py-5" aria-label="Notifications">
              <h2 className="mt-0 mb-1 text-navy-900 text-lg">Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}</h2>
              <p className="mt-0 mb-4 text-muted text-sm">Events that affect your queue, newest first.</p>
              <ol className="m-0 p-0 list-none grid gap-2">
                {notifications.slice(0, 8).map((notice) => (
                  <li key={notice.id} className={"px-4 py-3 rounded-lg border flex items-start justify-between gap-4 flex-wrap " + (notice.readStatus ? "border-border bg-white" : "border-blue-600/30 bg-info-bg")}>
                    <div className="min-w-0">
                      <p className="m-0 text-sm text-ink">{notice.message}</p>
                      <p className="mt-1 mb-0 text-xs text-quiet">
                        {formatDate(notice.createdAt)}{notice.readStatus ? "" : " - unread"}
                        {notice.applicationId && (
                          <>
                            {" - "}
                            <a className="text-link" href={`/admin/applications/${notice.applicationId}`}>View application</a>
                          </>
                        )}
                      </p>
                    </div>
                    {!notice.readStatus && (
                      <button type="button" className="shrink-0 px-3 py-1.5 rounded-full border border-border bg-white text-muted text-xs font-semibold cursor-pointer hover:border-border-strong" onClick={() => handleMarkRead(notice.id)}>
                        Mark as read
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          );
        })()}

        {(() => {
          // Figma "Admissions overview" alignment, computed from live queue
          // data only. The mock-up's median review time is not derivable from
          // the current data model, so it is deliberately not shown.
          const counts = { submitted: 0, under_review: 0, offer: 0, rejected: 0, withdrawn: 0 };
          applications.forEach((a) => {
            if (counts[a.status] !== undefined) counts[a.status] += 1;
          });
          const open = counts.submitted + counts.under_review;
          const decided = counts.offer + counts.rejected;
          const offerRate = decided
            ? Math.round((counts.offer / decided) * 100) + "% offer rate"
            : "No decisions issued yet";
          const stages = [
            ["Submitted", counts.submitted],
            ["Under review", counts.under_review],
            ["Offer issued", counts.offer],
            ["Rejected", counts.rejected],
            ["Withdrawn", counts.withdrawn],
          ];
          const max = Math.max(1, ...stages.map((s) => s[1]));
          const CARD = "border border-border rounded-[14px] bg-white shadow-sm px-6 py-5";
          return (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6 max-sm:grid-cols-1">
                <div className={CARD}>
                  <p className="mt-0 mb-2 text-quiet text-[11px] font-bold uppercase tracking-[0.08em]">Open applications</p>
                  <p className="m-0 text-navy-900 text-3xl font-semibold">{open}</p>
                  <p className="mt-1 mb-0 text-muted text-xs">Submitted or under review</p>
                </div>
                <div className={CARD}>
                  <p className="mt-0 mb-2 text-quiet text-[11px] font-bold uppercase tracking-[0.08em]">Awaiting first review</p>
                  <p className="m-0 text-navy-900 text-3xl font-semibold">{counts.submitted}</p>
                  <p className="mt-1 mb-0 text-muted text-xs">Newest submissions appear first in the queue</p>
                </div>
                <div className={CARD}>
                  <p className="mt-0 mb-2 text-quiet text-[11px] font-bold uppercase tracking-[0.08em]">Decisions issued</p>
                  <p className="m-0 text-navy-900 text-3xl font-semibold">{decided}</p>
                  <p className="mt-1 mb-0 text-muted text-xs">{offerRate}</p>
                </div>
              </div>
              <div className="border border-border rounded-[14px] bg-white shadow-sm px-6 py-5 mb-8">
                <p className="mt-0 mb-1 text-blue-700 text-[11px] font-bold uppercase tracking-[0.08em]">Workload</p>
                <h2 className="mt-0 mb-4 text-navy-900 text-lg">Applications by stage</h2>
                <dl className="m-0 grid gap-3">
                  {stages.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[140px_1fr_32px] items-center gap-3 max-sm:grid-cols-[110px_1fr_28px]">
                      <dt className="text-muted text-xs">{label}</dt>
                      <dd className="m-0 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <span className="block h-full rounded-full bg-blue-600" style={{ width: ((value / max) * 100) + "%" }} />
                      </dd>
                      <dd className="m-0 text-ink text-sm font-semibold text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <h2 id="queue" className="mt-0 mb-3 text-navy-900 text-lg">Application queue</h2>
            </>
          );
        })()}

        {applications.length > 0 && (
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <label className="sr-only" htmlFor="queue-search">Search by student name or application ID</label>
            <input
              id="queue-search"
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisibleCount(10); }}
              placeholder="Search by student name or application ID"
              className="min-w-[260px] flex-1 max-w-[360px] px-3 py-2 border border-border rounded-lg bg-white text-sm text-ink"
            />
            <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
              {FILTERS.map(([value, label]) => {
                // "All active" hides withdrawn applications, so its count must hide them
              // too. Counting every application here while the list below filtered
              // withdrawn out made the chip disagree with the table underneath it
              // - "All active (4)" above three rows - and described a withdrawn
              // application as active.
              const count = value === "all"
                ? applications.filter((a) => a.status !== "withdrawn").length
                : applications.filter((a) => a.status === value).length;
                const active = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setStatusFilter(value); setVisibleCount(10); }}
                    aria-pressed={active}
                    className={"px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors " + (active ? "bg-navy-900 text-white border-navy-900" : "bg-white text-muted border-border hover:border-border-strong")}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {applications.length === 0 ? (
          <AlertBanner variant="info">
            No submitted applications for {universityName} yet. New submissions
            appear here automatically, newest first.
          </AlertBanner>
        ) : filtered.length === 0 ? (
          <AlertBanner variant="info">
            No applications match the current filter or search.
          </AlertBanner>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse bg-white border border-border rounded-lg overflow-hidden shadow-sm max-sm:min-w-0 max-sm:table-fixed">
              <caption className="sr-only">
                Applications submitted to {universityName}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={TH}>Applicant</th>
                  <th scope="col" className={TH}>Status</th>
                  <th scope="col" className={TH_HIDE}>Submitted</th>
                  <th scope="col" className={TH_HIDE}>Document</th>
                  <th scope="col" className={TH}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child_td]:border-b-0">
                {visible.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-100">
                    <td className={TD}>
                        {/* Name first: an admissions officer scans by applicant,
                            not by document ID. The ID stays underneath because
                            it is what gets quoted in support and in evidence. */}
                        <span className="block text-ink font-medium">{app.form?.fullName || "Name not recorded"}</span>
                        <span className="block font-mono text-[0.75rem] text-quiet [overflow-wrap:anywhere]">{app.id}</span>
                      </td>
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
            {filtered.length > visibleCount && (
              <div className="mt-3 flex justify-center">
                <button type="button" className="button button-secondary" onClick={() => setVisibleCount((n) => n + 10)}>
                  Show more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
