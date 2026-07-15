// app/reset-password/page.js
// Route: /reset-password (issue #8, Figure A.2).
//
// Build fix: same Suspense requirement as /verify-email - useSearchParams()
// needs a Suspense boundary or the production build fails. See that file's
// header comment for the doc reference.
//
// Two-stage screen driven by the oobCode query param:
//   - No oobCode: "request" stage - resetPassword() emails the link.
//     Always shows success, even if the account doesn't exist, so we don't
//     leak which emails are registered.
//   - oobCode present: "confirm" stage - verifyResetCode() checks the link
//     and returns the account email, then confirmPasswordReset() sets the
//     new password. Reached once Dawid/Ionut point the Firebase Console
//     "Password reset" template's action URL at this route.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "../../components/auth/AuthCard";
import FormField from "../../components/auth/FormField";
import PasswordInput from "../../components/auth/PasswordInput";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import { resetPassword, verifyResetCode, confirmPasswordReset } from "../../lib/auth";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  mapAuthErrorToMessage,
} from "../../lib/validation";
import styles from "../../components/auth/auth.module.css";

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    setError(emailErr);
    if (emailErr) return;

    setStatus("loading");
    try {
      await resetPassword(email.trim());
      setStatus("success");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setStatus("success"); // don't reveal whether the account exists
        return;
      }
      setError(mapAuthErrorToMessage(err.code));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <AlertBanner variant="success">
        If an account exists for that email, a password reset link is on its way.
      </AlertBanner>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {status === "error" && error && <AlertBanner variant="error">{error}</AlertBanner>}
      <FormField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={status !== "error" ? error : undefined}
        autoComplete="email"
      />
      <LoadingButton loading={status === "loading"}>Send reset link</LoadingButton>
    </form>
  );
}

function ConfirmResetForm({ oobCode }) {
  const router = useRouter();
  const [checkStatus, setCheckStatus] = useState("loading");
  const [checkError, setCheckError] = useState(null);
  const [accountEmail, setAccountEmail] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    verifyResetCode(oobCode)
      .then((email) => {
        setAccountEmail(email);
        setCheckStatus("success");
      })
      .catch((err) => {
        setCheckError(mapAuthErrorToMessage(err.code));
        setCheckStatus("error");
      });
  }, [oobCode]);

  async function handleSubmit(e) {
    e.preventDefault();
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPasswordValue);
    setErrors({ password: passwordErr, confirmPassword: confirmErr });
    if (passwordErr || confirmErr) return;

    setSubmitStatus("loading");
    try {
      await confirmPasswordReset(oobCode, password);
      setSubmitStatus("success");
    } catch (err) {
      setSubmitError(mapAuthErrorToMessage(err.code));
      setSubmitStatus("error");
    }
  }

  if (checkStatus === "loading") {
    return <AlertBanner variant="info">Checking your reset link...</AlertBanner>;
  }

  if (checkStatus === "error") {
    return (
      <>
        <AlertBanner variant="error">{checkError}</AlertBanner>
        <a href="/reset-password" className={styles.link}>
          Request a new reset link
        </a>
      </>
    );
  }

  if (submitStatus === "success") {
    return (
      <>
        <AlertBanner variant="success">
          Password updated for {accountEmail}. You can now log in.
        </AlertBanner>
        <LoadingButton loading={false} onClick={() => router.push("/login")}>
          Go to login
        </LoadingButton>
      </>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.footerText} style={{ textAlign: "left" }}>
        Setting a new password for <strong>{accountEmail}</strong>.
      </p>
      {submitStatus === "error" && submitError && (
        <AlertBanner variant="error">{submitError}</AlertBanner>
      )}
      <PasswordInput
        label="New password"
        name="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        showStrength
      />
      <PasswordInput
        label="Confirm new password"
        name="confirmPassword"
        value={confirmPasswordValue}
        onChange={setConfirmPasswordValue}
        error={errors.confirmPassword}
      />
      <LoadingButton loading={submitStatus === "loading"}>Update password</LoadingButton>
    </form>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  return (
    <AuthCard
      title={oobCode ? "Set a new password" : "Reset your password"}
      subtitle={
        oobCode ? undefined : "Enter your email and we'll send you a link to reset your password."
      }
    >
      {oobCode ? <ConfirmResetForm oobCode={oobCode} /> : <RequestResetForm />}
    </AuthCard>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthCard title="Reset your password">
      <AlertBanner variant="info">Loading...</AlertBanner>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
