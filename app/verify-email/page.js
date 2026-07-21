// app/verify-email/page.js
// Route: /verify-email (issue #8).
//
// Build fix: useSearchParams() must be wrapped in a Suspense boundary or
// `next build` fails during static generation with "Missing Suspense
// boundary with useSearchParams" (confirmed against the Next.js docs for
// useSearchParams). The default export below only renders the Suspense
// wrapper; all the actual logic lives in VerifyEmailContent.
//
// Two purposes in one screen:
//   1. Landing page after registration / a blocked login: "check your
//      inbox", with a resend button.
//   2. Target of the emailed link: once Dawid/Ionut set the Firebase
//      Console action URL for the "Email address verification" template to
//      this route, the link will carry ?mode=verifyEmail&oobCode=... and we
//      apply it directly.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "../../components/auth/AuthCard";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import { confirmEmailVerification, resendVerification, watchAuth } from "../../lib/auth";
import { mapAuthErrorToMessage } from "../../lib/validation";
import styles from "../../components/auth/auth.module.css";

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
      <AuthCard title="Confirming your email">
        {confirmStatus === "loading" && (
          <AlertBanner variant="info">Confirming your email address...</AlertBanner>
        )}
        {confirmStatus === "success" && (
          <>
            <AlertBanner variant="success">
              Your email is verified. You can now log in.
            </AlertBanner>
            <LoadingButton loading={false} onClick={() => router.push("/login")}>
              Go to login
            </LoadingButton>
          </>
        )}
        {confirmStatus === "error" && confirmError && (
          <AlertBanner variant="error">{confirmError}</AlertBanner>
        )}
      </AuthCard>
    );
  }

  // Case 2: user just registered / tried to log in before verifying.
  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        initialSendFailed
          ? "Confirm your email address to activate your account."
          : "Your account is ready. Check your inbox for a confirmation link and click it to activate."
      }
    >
      {initialSendFailed && resendStatus === "idle" && (
        <AlertBanner variant="error">
          Your account was created, but the confirmation email could not be sent. Resend it below, and check your spam folder too.
        </AlertBanner>
      )}
      {resendStatus === "success" && (
        <AlertBanner variant="success">Verification email resent. Check your inbox.</AlertBanner>
      )}
      {resendStatus === "error" && resendError && (
        <AlertBanner variant="error">{resendError}</AlertBanner>
      )}

      <LoadingButton loading={resendStatus === "loading"} onClick={handleResend}>
        Resend verification email
      </LoadingButton>

      <p className={styles.footerText}>
        Already verified?{" "}
        <a href="/login" className={styles.link}>
          Log in
        </a>
      </p>
      {currentUser && (
        <p className={styles.footerText}>
          Wrong email?{" "}
          <button
            type="button"
            className={styles.link}
            style={{ background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
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
    </AuthCard>
  );
}

function VerifyEmailFallback() {
  return (
    <AuthCard title="Verify your email">
      <AlertBanner variant="info">Loading...</AlertBanner>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
