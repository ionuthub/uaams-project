// app/admin/invite/page.js
// Route: /admin/invite - an admissions officer invites a colleague (#195).
//
// Reached from the "Invite a colleague" link in the admin portal footer, which
// sits next to Privacy: administrative rather than day-to-day work. There is
// deliberately no public route to this page.
//
// The university is never chosen here. The server reads it from the signed-in
// officer own profile, so an officer can only ever invite into their own
// institution. This page only shows which one that is.

"use client";

import { useEffect, useState } from "react";
import AuthCard from "../../../components/auth/AuthCard";
import AlertBanner from "../../../components/auth/AlertBanner";
import LoadingButton from "../../../components/auth/LoadingButton";
import PortalShell from "../../../components/portal/PortalShell";
import { watchAuth, getUserProfile, logout } from "../../../lib/auth";
import { getUniversities } from "../../../lib/db";

const NAV = [
  { key: "home", label: "Home", href: "/" },
  {
    key: "admin-dashboard",
    label: "Dashboard",
    children: [
      { key: "queue", label: "Application queue", href: "/admin" },
      { key: "invite", label: "Invite a colleague", href: "/admin/invite" },
    ],
  },
];

const FOOTER = [
  { label: "Privacy", href: "/privacy" },
  { label: "Invite a colleague", href: "/admin/invite" },
];

const FIELD =
  "w-full px-3 py-2 border border-border rounded-lg bg-white text-sm text-ink";

// Provider and server codes turned into something a person can act on.
const MESSAGES = {
  "invite/address-in-use": "That address already has an account. Ask them to sign in instead.",
  "request/invalid-email": "That email address does not look right.",
  "invite/email-failed": "The invitation could not be sent. Check the address and try again.",
  "auth/not-an-admin": "Your account cannot send invitations.",
  "invite/not-found": "That invitation no longer exists.",
  "invite/not-usable": "That invitation has already been used or cancelled.",
};

function friendly(code, fallback) {
  return MESSAGES[code] || fallback;
}

function formatDate(millis) {
  if (!millis) return "-";
  return new Date(millis).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminInvitePage() {
  const [phase, setPhase] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [universityName, setUniversityName] = useState("");
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  // Every call carries the officer ID token; the server never trusts the page.
  async function authorisedFetch(path, options = {}) {
    const { getAuthClient } = await import("../../../lib/firebase");
    const user = getAuthClient().currentUser;
    if (!user) throw new Error("signed-out");
    const token = await user.getIdToken();
    return fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: "Bearer " + token,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  }

  async function loadInvites() {
    try {
      const response = await authorisedFetch("/api/admin/invite");
      const data = await response.json();
      if (data.ok) setInvites(data.invites || []);
    } catch {
      // The form still works without the list; do not block on it.
    }
  }

  useEffect(() => {
    let active = true;
    const unsubscribe = watchAuth(async (user) => {
      if (!user) {
        if (active) setPhase("signed-out");
        return;
      }
      try {
        const userProfile = await getUserProfile(user.uid);
        if (!active) return;
        if (!userProfile || userProfile.role !== "admin" || !userProfile.universityId) {
          setPhase("denied");
          return;
        }
        setProfile(userProfile);
        const universities = await getUniversities().catch(() => []);
        const match = universities.find((u) => u.id === userProfile.universityId);
        if (!active) return;
        setUniversityName(match ? match.name : userProfile.universityId);
        setPhase("ready");
        loadInvites();
      } catch {
        if (active) setPhase("error");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleSend(event) {
    event.preventDefault();
    setNotice(null);
    setSending(true);
    try {
      const response = await authorisedFetch("/api/admin/invite", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!data.ok) {
        setNotice({
          variant: "error",
          text: friendly(data.error, "The invitation could not be sent."),
        });
      } else {
        setNotice({
          variant: "success",
          text: "Invitation sent to " + data.email + ". The link expires in 7 days.",
        });
        setEmail("");
        loadInvites();
      }
    } catch {
      setNotice({ variant: "error", text: "The invitation could not be sent." });
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(inviteId) {
    // PRD-UX-03 (#231): cancelling kills the emailed link permanently - the
    // colleague would need a fresh invitation. Same native-confirm choice as
    // the decision confirmation, for the same accessibility reasons.
    if (
      !window.confirm(
        "Cancel this invitation? The link already emailed to them will stop working, and they would need a new invitation to join."
      )
    ) {
      return;
    }
    setNotice(null);
    try {
      const response = await authorisedFetch("/api/admin/invite", {
        method: "DELETE",
        body: JSON.stringify({ inviteId }),
      });
      const data = await response.json();
      if (!data.ok) {
        setNotice({ variant: "error", text: friendly(data.error, "Could not cancel that invitation.") });
      } else {
        setNotice({ variant: "success", text: "Invitation cancelled." });
      }
      loadInvites();
    } catch {
      setNotice({ variant: "error", text: "Could not cancel that invitation." });
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard title="Admissions">
        <p className="text-muted text-[0.9rem]" role="status">Loading...</p>
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
          This area is only available to admissions officers.
        </AlertBanner>
        <LoadingButton loading={false} onClick={() => logout()}>Log out</LoadingButton>
      </AuthCard>
    );
  }

  if (phase === "error") {
    return (
      <AuthCard title="Admissions">
        <AlertBanner variant="error">
          This page could not be loaded. Check your connection and try again.
        </AlertBanner>
        <LoadingButton loading={false} onClick={() => window.location.reload()}>
          Try again
        </LoadingButton>
      </AuthCard>
    );
  }

  const pending = invites.filter((i) => i.status === "pending");
  const settled = invites.filter((i) => i.status !== "pending");

  return (
    <PortalShell
      user={{ displayName: profile.fullName, email: profile.email }}
      current="invite"
      nav={NAV}
      subtitle="Admissions"
      roleLabel="Admissions officer"
      footerLinks={FOOTER}
    >
      <div className="max-w-[720px] mx-auto my-10 px-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
          Administration
        </p>
        <h1 className="mt-0 mb-1 text-2xl text-navy-900 font-editorial">Invite a colleague</h1>
        <p className="text-muted text-[0.9rem] mt-0 mb-6">
          They will receive a link to set their own password. Their account will be
          created for <strong>{universityName}</strong>, the same institution as yours.
          You cannot invite somebody into a different university.
        </p>

        {notice && (
          <div className="mb-4">
            <AlertBanner variant={notice.variant}>{notice.text}</AlertBanner>
          </div>
        )}

        <form onSubmit={handleSend} className="border border-border rounded-[14px] bg-white shadow-sm px-6 py-5 mb-8">
          <label className="block mb-1.5 text-sm font-semibold text-ink" htmlFor="invite-email">
            Their work email address
          </label>
          <input
            id="invite-email"
            type="email"
            required
            autoComplete="off"
            className={FIELD}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@university.ac.uk"
          />
          <p className="mt-2 mb-4 text-quiet text-xs">
            Check the address carefully. Anyone who receives this link can create an
            admissions account with access to applicant records.
          </p>
          <LoadingButton loading={sending} type="submit">Send invitation</LoadingButton>
        </form>

        <h2 className="mt-0 mb-3 text-navy-900 text-lg">Outstanding invitations</h2>
        {pending.length === 0 ? (
          <AlertBanner variant="info">No invitations are waiting to be accepted.</AlertBanner>
        ) : (
          <ul className="m-0 p-0 list-none grid gap-2 mb-8">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="px-4 py-3 rounded-lg border border-border bg-white flex items-start justify-between gap-4 flex-wrap"
              >
                <div className="min-w-0">
                  <p className="m-0 text-sm text-ink">{invite.email}</p>
                  <p className="mt-1 mb-0 text-xs text-quiet">
                    Sent {formatDate(invite.createdAt)} - expires {formatDate(invite.expiresAt)}
                    {invite.invitedByName ? " - by " + invite.invitedByName : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(invite.id)}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-border bg-white text-muted text-xs font-semibold cursor-pointer hover:border-border-strong"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}

        {settled.length > 0 && (
          <>
            <h2 className="mt-0 mb-3 text-navy-900 text-lg">Previous invitations</h2>
            <ul className="m-0 p-0 list-none grid gap-2">
              {settled.slice(0, 10).map((invite) => (
                <li key={invite.id} className="px-4 py-3 rounded-lg border border-border bg-white">
                  <p className="m-0 text-sm text-ink">{invite.email}</p>
                  <p className="mt-1 mb-0 text-xs text-quiet">
                    {invite.status === "accepted" ? "Accepted" : "Cancelled"} -
                    sent {formatDate(invite.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PortalShell>
  );
}
