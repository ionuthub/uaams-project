"use client";

import { useEffect, useState } from "react";
import AlertBanner from "../../components/auth/AlertBanner";
import AuthCard from "../../components/auth/AuthCard";
import LoadingButton from "../../components/auth/LoadingButton";
import PortalShell from "../../components/portal/PortalShell";
import { watchAuth } from "../../lib/auth";
import { getStudentApplications } from "../../lib/db";
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

  const firstName = user && user.displayName ? user.displayName.split(" ")[0] : "";
  const activeCount = applications.filter((a) => ["draft", "submitted", "under_review"].includes(a.status)).length;
  const action = getNextAction(applications);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const subtitle = applications.length === 0
    ? "Choose a university and start your first application."
    : activeCount > 0
      ? "You have " + activeCount + " active application" + (activeCount === 1 ? "" : "s") + ". Here is what needs your attention."
      : "All of your applications have received a decision.";

  return (
    <PortalShell user={user} current="dashboard">
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
            <a className="button button-primary" href={action.href}>{action.cta}</a>
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
                      const dot = state === "done" ? "✓" : index + 1;
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
      </div>
    </PortalShell>
  );
}
