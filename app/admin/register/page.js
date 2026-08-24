// app/admin/register/page.js
// Route: /admin/register?token=... - the invited colleague sets their password (#195).
//
// Only reachable with a valid invitation token. There is no link to this page
// anywhere in the product: without a token it shows nothing useful, which is
// the intent. The email address and institution are read from the invitation,
// never typed here, so the person accepting cannot change either.
//
// The token is read from window.location rather than useSearchParams: that hook
// requires a Suspense boundary in the App Router and fails the production build
// without one.

"use client";

import { useEffect, useState } from "react";
import AuthCard from "../../../components/auth/AuthCard";
import AlertBanner from "../../../components/auth/AlertBanner";
import LoadingButton from "../../../components/auth/LoadingButton";

const FIELD =
  "w-full px-3 py-2 border border-border rounded-lg bg-white text-sm text-ink";

const MESSAGES = {
  "invite/not-found": "This invitation link is not valid. Ask your colleague to send a new one.",
  "invite/not-usable": "This invitation has already been used, cancelled or expired. Ask for a new one.",
  "invite/invalid-token": "This invitation link is not valid. Ask your colleague to send a new one.",
  "invite/address-in-use": "An account already exists for this address. Try signing in instead.",
  "request/weak-password": "Use at least 8 characters, one uppercase letter and one number.",
  "request/invalid-name": "Enter your full name.",
};

function friendly(code, fallback) {
  return MESSAGES[code] || fallback;
}

export default function AdminRegisterPage() {
  const [phase, setPhase] = useState("loading");
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const value = new URLSearchParams(window.location.search).get("token") || "";
    if (!value) {
      setPhase("invalid");
      setError("This page needs an invitation link.");
      return undefined;
    }
    setToken(value);

    // Checked before anyone types a password, so a dead link fails immediately
    // rather than after filling in a form.
    fetch("/api/admin/accept-invite?token=" + encodeURIComponent(value))
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (!data.ok) {
          setPhase("invalid");
          setError(friendly(data.error, "This invitation link is not valid."));
          return;
        }
        setInvite(data);
        setPhase("ready");
      })
      .catch(() => {
        if (active) {
          setPhase("invalid");
          setError("This invitation could not be checked. Try again shortly.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, fullName: fullName.trim() }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(friendly(data.error, "Your account could not be created."));
        setSaving(false);
        return;
      }
      setPhase("done");
    } catch {
      setError("Your account could not be created. Check your connection and try again.");
      setSaving(false);
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard title="Join the admissions team">
        <p className="text-muted text-[0.9rem]" role="status">Checking your invitation...</p>
      </AuthCard>
    );
  }

  if (phase === "invalid") {
    return (
      <AuthCard title="Join the admissions team">
        <AlertBanner variant="error">{error}</AlertBanner>
        <p className="text-muted text-[0.9rem]">
          Already have an account?{" "}
          <a className="text-link" href="/admin/login">Staff sign-in</a>
        </p>
      </AuthCard>
    );
  }

  if (phase === "done") {
    return (
      <AuthCard title="Account created">
        <AlertBanner variant="success">
          Your admissions account is ready. Sign in with {invite.email}.
        </AlertBanner>
        <p className="text-muted text-[0.9rem]">
          <a className="text-link" href="/admin/login">Go to staff sign-in</a>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Join the admissions team">
      <p className="text-muted text-[0.9rem] mt-0 mb-4">
        {invite.invitedByName ? invite.invitedByName + " has invited you" : "You have been invited"}
        {" to join "}
        <strong>{invite.universityName}</strong>
        {" on UAAMS. Set a password to finish."}
      </p>

      {error && (
        <div className="mb-4">
          <AlertBanner variant="error">{error}</AlertBanner>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="block mb-1.5 text-sm font-semibold text-ink" htmlFor="admin-email">
          Email address
        </label>
        <input
          id="admin-email"
          type="email"
          className={FIELD + " bg-slate-50 text-muted"}
          value={invite.email}
          readOnly
          aria-describedby="admin-email-note"
        />
        <p id="admin-email-note" className="mt-1 mb-4 text-quiet text-xs">
          This is the address your invitation was sent to and cannot be changed.
        </p>

        <label className="block mb-1.5 text-sm font-semibold text-ink" htmlFor="admin-name">
          Full name <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="admin-name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          className={FIELD}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <div className="h-4" />

        <label className="block mb-1.5 text-sm font-semibold text-ink" htmlFor="admin-password">
          Password <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="new-password"
          className={FIELD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="admin-password-rule"
        />
        <p id="admin-password-rule" className="mt-1 mb-4 text-quiet text-xs">
          At least 8 characters, with one uppercase letter and one number.
        </p>

        <label className="block mb-1.5 text-sm font-semibold text-ink" htmlFor="admin-confirm">
          Confirm password <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id="admin-confirm"
          type="password"
          required
          autoComplete="new-password"
          className={FIELD}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div className="h-5" />

        <LoadingButton loading={saving} type="submit">Create my account</LoadingButton>
      </form>
    </AuthCard>
  );
}
