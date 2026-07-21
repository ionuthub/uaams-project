// app/reset-password/page.js
// Route: /reset-password (issue #8, Figure A.2).
//
// Build fix: same Suspense requirement as /verify-email - useSearchParams()
// needs a Suspense boundary or the production build fails.
//
// Two-stage screen driven by the oobCode query param:
//   - No oobCode: "request" stage - resetPassword() emails the link.
//     Always shows success, even if the account does not exist, so we do not
//     leak which emails are registered.
//   - oobCode present: "confirm" stage - verifyResetCode() checks the link
//     and returns the account email, then confirmPasswordReset() sets the
//     new password.
//
// Presentation uses the shared two-column AuthShell so this route matches
// login and register. The logic is unchanged.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

      <label htmlFor="reset-email">
        <span className="label-text">Email address<span className="req" aria-hidden="true">*</span></span>
        <input
          id="reset-email"
          type="email"
          value={email}
          autoComplete="email"
          aria-invalid={status !== "error" && !!error}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
        />
        {status !== "error" && error && <span className="field-error" role="alert">{error}</span>}
      </label>

      <button className="button button-primary button-large button-full" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send reset link"}
      </button>

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
        <button className="button button-primary button-large button-full" type="button" onClick={() => router.push("/login")}>
          Go to login
        </button>
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

      <label htmlFor="reset-new-password">
        <span className="label-text">New password<span className="req" aria-hidden="true">*</span></span>
        <span className="password-field">
          <input
            id="reset-new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => (prev.password ? { ...prev, password: null } : prev));
            }}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
        {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
        {!errors.password && strength && (
          <span className={`auth-strength is-${strength}`}>Password strength: {STRENGTH_LABEL[strength]}</span>
        )}
      </label>

      <label htmlFor="reset-confirm-password">
        <span className="label-text">Confirm new password<span className="req" aria-hidden="true">*</span></span>
        <span className="password-field">
          <input
            id="reset-confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirmPasswordValue}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            onChange={(e) => {
              setConfirmPasswordValue(e.target.value);
              setErrors((prev) => (prev.confirmPassword ? { ...prev, confirmPassword: null } : prev));
            }}
          />
          <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"}>
            {showConfirm ? "Hide" : "Show"}
          </button>
        </span>
        {errors.confirmPassword && <span className="field-error" role="alert">{errors.confirmPassword}</span>}
      </label>

      <button className="button button-primary button-large button-full" type="submit" disabled={submitStatus === "loading"}>
        {submitStatus === "loading" ? "Updating..." : "Update password"}
      </button>
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
