// app/reset-password/page.js
// Route: /reset-password (issue #8). useSearchParams needs a Suspense boundary.
//
// Migration step: form controls use React Aria (TextField / Button), styled
// with Tailwind. Two-stage logic (request link / confirm new password) and the
// shared AuthShell layout are unchanged.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField, Label, Input, FieldError, Button } from "react-aria-components";
import AuthShell from "../../components/auth/AuthShell";
import { resetPassword, verifyResetCode, confirmPasswordReset } from "../../lib/auth";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  passwordStrength,
  mapAuthErrorToMessage,
} from "../../lib/validation";

const RESET_STORY = {
  eyebrow: "Account recovery",
  headline: "Reset your password securely.",
  subtext: "We will email you a secure link so you can set a new password for your UAAMS account.",
};

const STRENGTH_LABEL = { weak: "Weak", medium: "Okay", strong: "Strong" };
const INPUT = "w-full min-h-12 px-[13px] py-[11px] border border-border-strong rounded-[7px] text-ink bg-white outline-0 focus:border-blue-600 focus:shadow-[0_0_0_4px_var(--color-blue-100)]";
const LABEL = "!flex items-center gap-1";
const SUBMIT = "w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-[13px] rounded-lg border border-transparent bg-blue-600 text-white font-semibold text-[15px] transition hover:bg-blue-700 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed";
const TOGGLE = "absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-blue-600 text-[11px] font-bold cursor-pointer";

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
      <div className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow">Reset password</p>
          <h1>Check your email</h1>
        </div>
        <div className="auth-alert is-success" role="status">
          If an account exists for that email, a password reset link is on its way.
        </div>
        <p className="auth-footer-links"><a href="/login">Back to sign in</a></p>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <p className="eyebrow">Reset password</p>
        <h1>Reset your password</h1>
        <p>Enter your email and we will send you a link to reset your password.</p>
      </div>

      {status === "error" && error && <div className="auth-alert is-error" role="alert">{error}</div>}

      <TextField
        name="email"
        type="email"
        value={email}
        onChange={(v) => { setEmail(v); if (error) setError(null); }}
        isInvalid={status !== "error" && !!error}
        isRequired
        className="grid gap-2"
      >
        <Label className={LABEL}>Email address<span className="text-error" aria-hidden="true">*</span></Label>
        <Input autoComplete="email" className={INPUT} />
        <FieldError className="field-error">{error}</FieldError>
      </TextField>

      <Button type="submit" isDisabled={status === "loading"} className={SUBMIT}>
        {status === "loading" ? "Sending..." : "Send reset link"}
      </Button>

      <p className="auth-footer-links"><a href="/login">Back to sign in</a></p>
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    return (
      <div className="auth-card">
        <div className="auth-heading"><h1>Set a new password</h1></div>
        <div className="auth-alert is-info" role="status">Checking your reset link...</div>
      </div>
    );
  }

  if (checkStatus === "error") {
    return (
      <div className="auth-card">
        <div className="auth-heading"><h1>Reset link problem</h1></div>
        <div className="auth-alert is-error" role="alert">{checkError}</div>
        <p className="auth-footer-links"><a href="/reset-password">Request a new reset link</a></p>
      </div>
    );
  }

  if (submitStatus === "success") {
    return (
      <div className="auth-card">
        <div className="auth-heading"><h1>Password updated</h1></div>
        <div className="auth-alert is-success" role="status">
          Password updated for {accountEmail}. You can now log in.
        </div>
        <Button type="button" onPress={() => router.push("/login")} className={SUBMIT}>Go to login</Button>
      </div>
    );
  }

  const strength = password ? passwordStrength(password) : null;

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <div className="auth-heading">
        <p className="eyebrow">Reset password</p>
        <h1>Set a new password</h1>
        <p>Setting a new password for <strong>{accountEmail}</strong>.</p>
      </div>

      {submitStatus === "error" && submitError && <div className="auth-alert is-error" role="alert">{submitError}</div>}

      <TextField
        name="new-password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(v) => { setPassword(v); setErrors((prev) => (prev.password ? { ...prev, password: null } : prev)); }}
        isInvalid={!!errors.password}
        isRequired
        className="grid gap-2"
      >
        <Label className={LABEL}>New password<span className="text-error" aria-hidden="true">*</span></Label>
        <div className="relative">
          <Input autoComplete="new-password" className={INPUT + " pr-16"} />
          <Button type="button" onPress={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className={TOGGLE}>{showPassword ? "Hide" : "Show"}</Button>
        </div>
        <FieldError className="field-error">{errors.password}</FieldError>
        {!errors.password && strength && (<span className={`auth-strength is-${strength}`}>Password strength: {STRENGTH_LABEL[strength]}</span>)}
      </TextField>

      <TextField
        name="confirm-password"
        type={showConfirm ? "text" : "password"}
        value={confirmPasswordValue}
        onChange={(v) => { setConfirmPasswordValue(v); setErrors((prev) => (prev.confirmPassword ? { ...prev, confirmPassword: null } : prev)); }}
        isInvalid={!!errors.confirmPassword}
        isRequired
        className="grid gap-2"
      >
        <Label className={LABEL}>Confirm new password<span className="text-error" aria-hidden="true">*</span></Label>
        <div className="relative">
          <Input autoComplete="new-password" className={INPUT + " pr-16"} />
          <Button type="button" onPress={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} className={TOGGLE}>{showConfirm ? "Hide" : "Show"}</Button>
        </div>
        <FieldError className="field-error">{errors.confirmPassword}</FieldError>
      </TextField>

      <Button type="submit" isDisabled={submitStatus === "loading"} className={SUBMIT}>
        {submitStatus === "loading" ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  return (
    <AuthShell story={RESET_STORY}>
      {oobCode ? <ConfirmResetForm oobCode={oobCode} /> : <RequestResetForm />}
    </AuthShell>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthShell story={RESET_STORY}>
      <div className="auth-card">
        <div className="auth-heading"><h1>Reset your password</h1></div>
        <div className="auth-alert is-info" role="status">Loading...</div>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
