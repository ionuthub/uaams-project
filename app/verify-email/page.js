// app/verify-email/page.js
// Route: /verify-email (issue #8).
//
// Build fix: useSearchParams() must be wrapped in a Suspense boundary or
// `next build` fails during static generation with "Missing Suspense
// boundary with useSearchParams".
//
// Two purposes in one screen:
//   1. Landing page after registration / a blocked login: "check your
//      inbox", with a resend button.
//   2. Target of the emailed link: with ?mode=verifyEmail&oobCode=... we
//      apply the action code directly.
//
// Presentation uses the shared two-column AuthShell so this route matches
// login and register. The logic is unchanged.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { confirmEmailVerification, resendVerification, watchAuth } from "../../lib/auth";
import { mapAuthErrorToMessage } from "../../lib/validation";

const VERIFY_STORY = {
  eyebrow: "Secure account setup",
  headline: "One quick check protects your applications.",
  subtext: "We verify every applicant email before personal information or documents can be submitted.",
};

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const initialSendFailed = searchParams.get("sent") === "0";

  const [confirmStatus, setConfirmStatus] = useState(
    mode === "verifyEmail" && oobCode ? "loading" : "idle"
  );
  const [confirmError, setConfirmError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendError, setResendError] = useState(null);

  useEffect(() => {
    const unsub = watchAuth((user) => setCurrentUser(user));
    return unsub;
  }, []);

  useEffect(() => {
    if (mode !== "verifyEmail" || !oobCode) return;

    confirmEmailVerification(oobCode)
      .then(() => setConfirmStatus("success"))
      .catch((err) => {
        setConfirmError(mapAuthErrorToMessage(err.code));
        setConfirmStatus("error");
      });
  }, [mode, oobCode]);

  async function handleResend() {
    if (!currentUser) {
      setResendError("You need to be signed in to resend the verification email. Log in first.");
      setResendStatus("error");
      return;
    }
    setResendStatus("loading");
    setResendError(null);
    try {
      await resendVerification(currentUser);
      setResendStatus("success");
    } catch (err) {
      const friendly = mapAuthErrorToMessage(err.code);
      const code = err.code ? ` (${err.code})` : "";
      setResendError(friendly + code);
      setResendStatus("error");
    }
  }

  // Case 1: user arrived via the emailed link with an action code.
  if (mode === "verifyEmail" && oobCode) {
    return (
      <AuthShell story={VERIFY_STORY}>
        <div className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">Email verification</p>
            <h1>Confirming your email</h1>
          </div>
          {confirmStatus === "loading" && (
            <div className="auth-alert is-info" role="status">Confirming your email address...</div>
          )}
          {confirmStatus === "success" && (
            <>
              <div className="auth-alert is-success" role="status">Your email is verified. You can now log in.</div>
              <button className="button button-primary button-large button-full" type="button" onClick={() => router.push("/login")}>
                Go to login
              </button>
            </>
          )}
          {confirmStatus === "error" && confirmError && (
            <div className="auth-alert is-error" role="alert">{confirmError}</div>
          )}
        </div>
      </AuthShell>
    );
  }

  // Case 2: user just registered / tried to log in before verifying.
  return (
    <AuthShell story={VERIFY_STORY}>
      <div className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow">Check your inbox</p>
          <h1>Verify your email</h1>
          <p>
            {initialSendFailed
              ? "Confirm your email address to activate your account."
              : "Your account is ready. Check your inbox for a confirmation link and click it to activate."}
          </p>
        </div>

        {initialSendFailed && resendStatus === "idle" && (
          <div className="auth-alert is-error" role="alert">
            Your account was created, but the confirmation email could not be sent. Resend it below, and check your spam folder too.
          </div>
        )}
        {resendStatus === "success" && (
          <div className="auth-alert is-success" role="status">Verification email resent. Check your inbox.</div>
        )}
        {resendStatus === "error" && resendError && (
          <div className="auth-alert is-error" role="alert">{resendError}</div>
        )}

        <button className="button button-primary button-large button-full" type="button" disabled={resendStatus === "loading"} onClick={handleResend}>
          {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
        </button>

        <p className="auth-footer-links">
          Already verified?{" "}
          <a href="/login">Log in</a>
        </p>
        {currentUser && (
          <p className="auth-footer-links">
            Wrong email?{" "}
            <button
              type="button"
              className="auth-linkbutton"
              onClick={async () => {
                try {
                  const { logout } = await import("../../lib/auth");
                  await logout();
                } catch (_) { /* ignore */ }
                window.location.href = "/register";
              }}
            >
              Sign out and register again
            </button>
          </p>
        )}
      </div>
    </AuthShell>
  );
}

function VerifyEmailFallback() {
  return (
    <AuthShell story={VERIFY_STORY}>
      <div className="auth-card">
        <div className="auth-heading"><h1>Verify your email</h1></div>
        <div className="auth-alert is-info" role="status">Loading...</div>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
