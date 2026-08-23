"use client";

import { useEffect, useState } from "react";
import AlertBanner from "../../components/auth/AlertBanner";
import AuthCard from "../../components/auth/AuthCard";
import LoadingButton from "../../components/auth/LoadingButton";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth, getUserProfile } from "../../lib/auth";
import { getStudentApplications, getNotifications, markNotificationRead } from "../../lib/db";
import { statusMeta } from "../../components/StatusBadge";


const LI_BASE =
  "min-w-0 relative flex flex-col items-center gap-2.5 text-center before:content-[''] before:absolute before:z-0 before:left-[calc(50%+16px)] before:right-[calc(-50%+16px)] before:top-[15px] before:h-0.5 last:before:hidden max-[900px]:even:before:hidden";

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

// Figma dashboard alignment (Sprint 2): the design's "Your next action" banner,
// adapted to the live data model. Payment and finance-check stages from the
// mock-up are out of scope per the PRD, so actions only cover draft, offer
// and rejected states.
function getNextAction(applications) {
  const draft = applications.find((a) => a.status === "draft");
  if (draft) {
    return {
      title: "Finish your draft application",
      detail: "You have a saved draft. Complete the remaining sections and submit it when you are ready.",
      cta: "Continue draft",
      href: "/apply",
    };
  }
  const offer = applications.find((a) => a.status === "offer");
  if (offer) {
    return {
      title: "You have received an offer",
      detail: "Open the application to read the decision and the university's message.",
      cta: "View decision",
      href: "/student/applications/" + offer.id,
    };
  }
  const rejected = applications.find((a) => a.status === "rejected");
  if (rejected) {
    return {
      title: "A decision has been issued",
      detail: "Open the application to read the university's decision message.",
      cta: "View decision",
      href: "/student/applications/" + rejected.id,
    };
  }
  return null;
}

export default function StudentDashboardPage() {
  const [phase, setPhase] = useState("loading");
  // #196: staff accounts are not applicant accounts. The public header no
  // longer offers this portal to an admin, but the URL is still typeable, so
  // the page refuses it too. This is a clarity guard, not a security control -
  // an admin reading applications they own is legitimately allowed by the
  // rules, because those check ownership rather than role.
  const [staffAccount, setStaffAccount] = useState(false);

  useEffect(() => {
    let active = true;
    const stop = watchAuth(async (current) => {
      if (!active) return;
      if (!current) {
        setStaffAccount(false);
        return;
      }
      try {
        const profile = await getUserProfile(current.uid);
        if (active) setStaffAccount(profile?.role === "admin");
      } catch {
        // Fail open: if the role cannot be read, show the applicant view
        // rather than locking someone out of their own dashboard.
        if (active) setStaffAccount(false);
      }
    });
    return () => {
      active = false;
      stop();
    };
  }, []);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileName, setProfileName] = useState("");
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
      // Issue #177: older accounts have no Auth displayName, so fall back to
      // the profile fullName for the greeting and the sidebar chip.
      if (!current.displayName) {
        try {
          const profile = await getUserProfile(current.uid);
          if (active && profile?.fullName) setProfileName(profile.fullName);
        } catch (error) {
          console.warn("Profile name unavailable:", error?.code || error?.message);
        }
      }
      try {
        setApplications(await getStudentApplications(current.uid));
        // Notifications (PRD 4.2.2, #164). Fails soft: if the rules are not
        // deployed yet the dashboard still works without the panel.
        try { setNotifications(await getNotifications(current.uid)); }
        catch (error) { console.warn("Notifications unavailable:", error?.code || error?.message); }
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
  if (staffAccount) {
    return (
      <AuthCard title="Your applications">
        <AlertBanner variant="info">
          This is the applicant portal. You are signed in with a staff account,
          which does not hold applications.
        </AlertBanner>
        <p className="text-muted text-[0.9rem]">
          <a className="text-link" href="/admin">Go to the application queue</a>
        </p>
      </AuthCard>
    );
  }

  if (phase === "signed-out") return <AuthCard title="My applications"><AlertBanner variant="error">Sign in to view your applications.</AlertBanner><a href="/login">Go to login</a></AuthCard>;
  if (phase === "unverified") return <AuthCard title="Verify your email"><AlertBanner variant="info">Verify your email before starting an application.</AlertBanner><a href="/verify-email">Verification help</a></AuthCard>;
  if (phase === "error") return <AuthCard title="My applications"><AlertBanner variant="error">We could not load your applications. Please try again.</AlertBanner><LoadingButton loading={false} onClick={() => window.location.reload()}>Try again</LoadingButton></AuthCard>;

  const bestName = (user && user.displayName) || profileName;
  const firstName = bestName ? bestName.split(" ")[0] : "";
  const activeCount = applications.filter((a) => ["draft", "submitted", "under_review"].includes(a.status)).length;
  const action = getNextAction(applications);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const unreadCount = notifications.filter((n) => !n.readStatus).length;
  const navWithCounts = [
    { key: "home", label: "Home", href: "/" },
    {
      key: "student-dashboard",
      label: "Dashboard",
      children: [
        { key: "dashboard", label: "My applications", href: "/student", badge: applications.length || null },
        { key: "apply", label: "New application", href: "/apply" },
        { key: "notifications", label: "Notifications", href: "#notifications", badge: unreadCount || null },
        // #241: visible but inactive ahead of the payments feature itself - real
        // payments (funding method, instalments, transactions) is separate,
        // larger scope pending a PRD change-request decision (see README). No
        // href, so PortalShell renders this as a disabled span, not a link.
        { key: "payments", label: "Payments", disabled: true },
      ],
    },
  ];

  async function handleMarkRead(notificationId) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((n) => (n.id === notificationId ? { ...n, readStatus: true } : n))
      );
    } catch (error) {
      console.warn("Mark as read failed:", error?.code || error?.message);
    }
  }
  const subtitle = applications.length === 0
    ? "Choose a university and start your first application."
    : activeCount > 0
      ? "You have " + activeCount + " active application" + (activeCount === 1 ? "" : "s") + ". Here is what needs your attention."
      : "All of your applications have received a decision.";

  return (
    <PortalShell user={{ displayName: bestName, email: user?.email }} current="dashboard" nav={navWithCounts}>
      <div className="max-w-[960px] mx-auto px-10 pt-[52px] pb-20 max-[900px]:px-5 max-[900px]:pt-9 max-[900px]:pb-16">
        <header className="mb-[30px] flex items-end justify-between gap-8 flex-wrap">
          <div>
            <p className="mt-0 mb-2.5 text-blue-600 text-xs font-bold tracking-[0.12em] uppercase">{today}</p>
            <h1 className="mt-0 mb-2.5 text-navy-900 font-editorial text-[clamp(30px,4vw,40px)] font-semibold tracking-[-0.02em] leading-[1.12]">Welcome back{firstName ? ", " + firstName : ""}</h1>
            <p className="m-0 max-w-[560px] text-muted">{subtitle}</p>
          </div>
          <a className="button button-primary" href="/apply">New application</a>
        </header>

        {action && (
          <section aria-label="Your next action" className="mb-[26px] px-7 py-6 flex items-center justify-between gap-6 flex-wrap border border-[#e7d9b8] border-l-4 border-l-[#d9a441] rounded-[14px] bg-[#fdf8ec]">
            <div>
              <p className="mt-0 mb-1.5 text-[#8a6d1f] text-[10px] font-bold tracking-[0.12em] uppercase">Your next action</p>
            <h2 className="mt-0 mb-1 text-navy-900 text-[19px]">{action.title}</h2>
              <p className="m-0 max-w-[560px] text-muted text-sm">{action.detail}</p>
            </div>
            <a className="button button-secondary !text-[#8a6d1f] !border-[#b3801f] hover:!bg-[#f6ecd4]" href={action.href}>{action.cta}</a>
          </section>
        )}

        {applications.length === 0 ? (
          <section className="px-8 py-16 grid justify-items-center text-center gap-3 border border-border rounded-[14px] bg-white shadow-sm">
            <span className="w-[54px] h-[54px] grid place-items-center rounded-[50%_50%_46%_46%] text-white bg-navy-900 font-editorial text-[26px]">U</span>
            <h2 className="mt-1 mb-0 text-navy-900 text-[22px]">No applications yet</h2>
            <p>Choose a university and create your first application. You can save a draft and return to it any time.</p>
            <a className="button button-primary" href="/apply">Start an application</a>
          </section>
        ) : (
          <section className="grid gap-[22px]" aria-label="Your applications">
            {applications.map((application) => {
              const meta = statusMeta(application.status);
              const states = JOURNEY[application.status] || JOURNEY.draft;
              const university = application.form?.universityName || "University application";
              const seal = university.trim().slice(0, 2).toUpperCase();
              return (
                <article className="border border-border rounded-[14px] bg-white shadow-sm overflow-hidden" key={application.id}>
                  <div className="px-7 pt-6 pb-[22px] flex items-start justify-between gap-5">
                    <div className="flex gap-4">
                      <span className="w-12 h-12 shrink-0 grid place-items-center border border-[#c2a979] rounded-full text-gold bg-[#fbf8f1] font-editorial font-semibold">{seal}</span>
                      <div>
                        <p className="mt-0 mb-1 text-quiet text-[10px] font-bold tracking-[0.1em] uppercase">Application</p>
                        <h2 className="mt-0 mb-1.5 text-navy-900 text-[21px] tracking-[-0.01em]">{university}</h2>
                        <p className="m-0 text-muted text-xs">Reference {application.id}</p>
                      </div>
                    </div>
                    <span className={"status status-" + meta.tone}>{meta.label}</span>
                  </div>

                  <ol className="m-0 px-7 pt-[30px] pb-7 grid grid-cols-4 list-none border-y border-border bg-[#fbfcfd] max-[900px]:grid-cols-2 max-[900px]:gap-y-5" aria-label="Application progress">
                    {STAGES.map((stage, index) => {
                      const state = states[index];
                      const dot = state === "done" ? "â" : index + 1;
                      return (
                        <li key={stage} className={LI_BASE + " " + (state === "done" ? "before:bg-success" : "before:bg-border")}>
                          <span className={"w-[31px] h-[31px] relative z-[1] shrink-0 grid place-items-center border-2 rounded-full text-[11px] font-bold " + (state === "done" ? "text-white bg-success border-success" : state === "current" ? "text-white bg-blue-600 border-blue-600 shadow-[0_0_0_5px_var(--color-blue-100)]" : "text-quiet bg-white border-border-strong")}>{dot}</span>
                          <strong className="text-xs text-ink leading-[1.2]">{stage}</strong>
                          {index === 3 && application.status === "offer" && <small className="mt-0.5 text-quiet text-[10px]">Offer made</small>}
                          {index === 3 && application.status === "rejected" && <small className="mt-0.5 text-quiet text-[10px]">Not successful</small>}
                        </li>
                      );
                    })}
                  </ol>

                  <div className="px-7 py-[18px] flex items-center justify-between gap-6 flex-wrap max-[900px]:flex-col max-[900px]:items-start">
                    <dl className="m-0 flex gap-10 [&>div]:grid [&>div]:gap-[3px] [&_dt]:text-quiet [&_dt]:text-[11px] [&_dt]:uppercase [&_dt]:tracking-[0.06em] [&_dd]:m-0 [&_dd]:text-ink [&_dd]:text-sm [&_dd]:font-semibold">
                      <div><dt>Submitted</dt><dd>{formatDate(application.submittedAt)}</dd></div>
                      <div><dt>Document</dt><dd>{application.documentPath ? "Attached" : "Not attached"}</dd></div>
                    </dl>
                    {application.status === "draft" ? (
                  <a className="button button-secondary" href="/apply">Continue application</a>
                ) : (
                  <a className="button button-secondary" href={`/student/applications/${application.id}`}>View application</a>
                )}
                  </div>

                  {application.latestDecisionMessage && (
                    <div className="px-7 pt-[18px] pb-[22px] border-t border-border bg-info-bg [&>p:last-child]:m-0 [&>p:last-child]:text-ink">
                      <p className="mt-0 mb-1 text-quiet text-[10px] font-bold tracking-[0.1em] uppercase">Message from the university</p>
                      <p>{application.latestDecisionMessage}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {notifications.length > 0 && (
          <section id="notifications" className="mt-[26px] border border-border rounded-[14px] bg-white shadow-sm px-7 py-6" aria-label="Notifications">
            <h2 className="mt-0 mb-1 text-navy-900 text-[19px]">Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}</h2>
            <p className="mt-0 mb-4 text-muted text-sm">Updates about your applications appear here as well as by email.</p>
            <ol className="m-0 p-0 list-none grid gap-2">
              {notifications.slice(0, 8).map((notice) => (
                <li key={notice.id} className={"px-4 py-3 rounded-lg border flex items-start justify-between gap-4 flex-wrap " + (notice.readStatus ? "border-border bg-white" : "border-blue-600/30 bg-info-bg")}>
                  <div className="min-w-0">
                    <p className="m-0 text-sm text-ink">{notice.message}</p>
                    <p className="mt-1 mb-0 text-xs text-quiet">{formatDate(notice.createdAt)}{notice.readStatus ? "" : " - unread"}</p>
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
        )}
      </div>
    </PortalShell>
  );
}
