// app/register/page.js
// Route: /register (issue #8).
//
// Uses the designed two-column auth-shell layout while keeping the real
// registration logic: PRD-required fields, full password rules, confirm
// password, privacy consent, and honest verification-email routing.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerStudent } from "../../lib/auth";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  passwordStrength,
  mapAuthErrorToMessage,
} from "../../lib/validation";

const INITIAL_STATE = {
  fullName: "",
  nationality: "",
  studyLevel: "",
  email: "",
  password: "",
  confirmPassword: "",
  privacyConsent: false,
};

const STRENGTH_LABEL = { weak: "Weak", medium: "Okay", strong: "Strong" };

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState(null);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate() {
    const next = {};
    const fullNameErr = validateRequired(form.fullName, "Full name");
    const emailErr = validateEmail(form.email);
    const nationalityErr = validateRequired(form.nationality, "Nationality");
    const studyLevelErr = validateRequired(form.studyLevel, "Intended study level");
    const passwordErr = validatePassword(form.password);
    const confirmErr = validateConfirmPassword(form.password, form.confirmPassword);

    if (fullNameErr) next.fullName = fullNameErr;
    if (emailErr) next.email = emailErr;
    if (nationalityErr) next.nationality = nationalityErr;
    if (studyLevelErr) next.studyLevel = studyLevelErr;
    if (passwordErr) next.password = passwordErr;
    if (confirmErr) next.confirmPassword = confirmErr;
    if (!form.privacyConsent) next.privacyConsent = "You must agree before creating an account.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setStatus("loading");
    try {
      const { verificationEmailSent } = await registerStudent(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
        form.nationality.trim(),
        form.studyLevel.trim()
      );
      setStatus("success");
      router.push(verificationEmailSent ? "/verify-email" : "/verify-email?sent=0");
    } catch (err) {
      setServerError(mapAuthErrorToMessage(err.code));
      setStatus("error");
    }
  }

  const strength = form.password ? passwordStrength(form.password) : null;

  return (
    <main className="auth-shell" aria-labelledby="register-title">
      <aside className="auth-story">
        <div className="auth-story-main">
          <a className="back-link light-link" href="/">
            <span aria-hidden="true">←</span> Back to UAAMS
          </a>
          <span className="brand-mark light-mark" aria-hidden="true">U</span>
          <p className="eyebrow">Create your account</p>
          <h2>Start your university journey with confidence.</h2>
          <p>One account lets you apply to Southampton Solent University, upload evidence securely and track your outcome.</p>
        </div>
      </aside>

      <div className="auth-panel">
        <form className="auth-card wide-auth-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-heading">
            <p className="eyebrow">Create account</p>
            <h1 id="register-title">Register as an applicant</h1>
            <p>Complete the fields below to create your student account.</p>
          </div>

          {status === "error" && serverError && (
            <div className="auth-alert is-error" role="alert">{serverError}</div>
          )}
          {status === "success" && (
            <div className="auth-alert is-success" role="status">Account created. Taking you to verify your email...</div>
          )}

          <label htmlFor="reg-name">
            <span className="label-text">Full name<span className="req" aria-hidden="true">*</span></span>
            <input id="reg-name" type="text" value={form.fullName} autoComplete="name" placeholder="e.g. Amara Osei"
              aria-invalid={!!errors.fullName} onChange={(e) => update("fullName", e.target.value)} />
            {errors.fullName && <span className="field-error" role="alert">{errors.fullName}</span>}
          </label>

          <div className="field-grid">
            <label htmlFor="reg-nationality">
              <span className="label-text">Nationality<span className="req" aria-hidden="true">*</span></span>
              <input id="reg-nationality" type="text" value={form.nationality} autoComplete="country-name"
                aria-invalid={!!errors.nationality} onChange={(e) => update("nationality", e.target.value)} />
              {errors.nationality && <span className="field-error" role="alert">{errors.nationality}</span>}
            </label>
            <label htmlFor="reg-level">
              <span className="label-text">Intended study level<span className="req" aria-hidden="true">*</span></span>
              <input id="reg-level" type="text" value={form.studyLevel} placeholder="e.g. Undergraduate"
                aria-invalid={!!errors.studyLevel} onChange={(e) => update("studyLevel", e.target.value)} />
              {errors.studyLevel && <span className="field-error" role="alert">{errors.studyLevel}</span>}
            </label>
          </div>

          <label htmlFor="reg-email">
            <span className="label-text">Email address<span className="req" aria-hidden="true">*</span></span>
            <input id="reg-email" type="email" value={form.email} autoComplete="email" placeholder="you@example.com"
              aria-invalid={!!errors.email} onChange={(e) => update("email", e.target.value)} />
            {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
          </label>

          <label htmlFor="reg-password">
            <span className="label-text">Password<span className="req" aria-hidden="true">*</span></span>
            <span className="password-field">
              <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password}
                autoComplete="new-password" aria-invalid={!!errors.password} onChange={(e) => update("password", e.target.value)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
            {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
            {!errors.password && strength && (
              <span className={`auth-strength is-${strength}`}>Password strength: {STRENGTH_LABEL[strength]}</span>
            )}
          </label>

          <label htmlFor="reg-confirm">
            <span className="label-text">Confirm password<span className="req" aria-hidden="true">*</span></span>
            <span className="password-field">
              <input id="reg-confirm" type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                autoComplete="new-password" aria-invalid={!!errors.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"}>
                {showConfirm ? "Hide" : "Show"}
              </button>
            </span>
            {errors.confirmPassword && <span className="field-error" role="alert">{errors.confirmPassword}</span>}
          </label>

          <label htmlFor="reg-privacy" className="check-row">
            <input id="reg-privacy" type="checkbox" checked={form.privacyConsent}
              onChange={(e) => update("privacyConsent", e.target.checked)}
              aria-describedby={errors.privacyConsent ? "reg-privacy-error" : undefined} />
            <span>I agree to the <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a> and the processing of my application data.</span>
          </label>
          {errors.privacyConsent && <p id="reg-privacy-error" className="field-error" role="alert">{errors.privacyConsent}</p>}

          <button className="button button-primary button-large button-full" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-footer-links">
            Already have an account?{" "}
            <a href="/login">Sign in</a>
          </p>
        </form>
      </div>
    </main>
  );
}
