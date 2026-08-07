// app/register/page.js
// Route: /register (issue #8).
//
// Migration step: form controls use React Aria (TextField / Button) for
// accessibility, styled with Tailwind. Native select (with the shared auth
// chevron) and native consent checkbox are kept. The two-column auth shell
// stays on the shared classes until the auth-layout pass.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Label, Input, FieldError, Button } from "react-aria-components";
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
const INPUT = "w-full min-h-12 px-[13px] py-[11px] border border-border-strong rounded-[7px] text-ink bg-white outline-0 focus:border-blue-600 focus:shadow-[0_0_0_4px_var(--color-blue-100)]";
const LABEL = "!flex items-center gap-1";

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
      const { user, verificationEmailSent } = await registerStudent(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
        form.nationality.trim(),
        form.studyLevel.trim()
      );
      // PRD 5 registration confirmation (#165): fire-and-forget welcome email.
      // A failure here must never block or fail the registration flow.
      user
        .getIdToken()
        .then((token) =>
          fetch("/api/email/welcome", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
        .catch((error) => {
          console.warn("Welcome email request failed:", error?.message || error);
        });
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

          <TextField name="fullName" value={form.fullName} onChange={(v) => update("fullName", v)} isInvalid={!!errors.fullName} isRequired className="grid gap-2">
            <Label className={LABEL}>Full name<span className="text-error" aria-hidden="true">*</span></Label>
            <Input autoComplete="name" placeholder="e.g. Amara Osei" className={INPUT} />
            <FieldError className="field-error">{errors.fullName}</FieldError>
          </TextField>

          <div className="field-grid">
            <TextField name="nationality" value={form.nationality} onChange={(v) => update("nationality", v)} isInvalid={!!errors.nationality} isRequired className="grid gap-2">
              <Label className={LABEL}>Nationality<span className="text-error" aria-hidden="true">*</span></Label>
              <Input autoComplete="country-name" className={INPUT} />
              <FieldError className="field-error">{errors.nationality}</FieldError>
            </TextField>
            <div className="grid gap-2">
              <label className={LABEL} htmlFor="reg-level">Intended study level<span className="text-error" aria-hidden="true">*</span></label>
              <select id="reg-level" required aria-required="true" value={form.studyLevel} aria-invalid={!!errors.studyLevel} onChange={(e) => update("studyLevel", e.target.value)}>
                <option value="">Select a study level</option>
                <option value="Foundation">Foundation</option>
                <option value="Bachelors">Bachelors</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
              {errors.studyLevel && <span className="field-error" role="alert">{errors.studyLevel}</span>}
            </div>
          </div>

          <TextField name="email" type="email" value={form.email} onChange={(v) => update("email", v)} isInvalid={!!errors.email} isRequired className="grid gap-2">
            <Label className={LABEL}>Email address<span className="text-error" aria-hidden="true">*</span></Label>
            <Input autoComplete="email" placeholder="you@example.com" className={INPUT} />
            <FieldError className="field-error">{errors.email}</FieldError>
          </TextField>

          <TextField name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(v) => update("password", v)} isInvalid={!!errors.password} isRequired className="grid gap-2">
            <Label className={LABEL}>Password<span className="text-error" aria-hidden="true">*</span></Label>
            <div className="relative">
              <Input autoComplete="new-password" className={INPUT + " pr-16"} />
              <Button type="button" onPress={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 min-h-6 min-w-11 grid place-items-center px-2 border-0 bg-transparent text-blue-600 text-[11px] font-bold cursor-pointer">{showPassword ? "Hide" : "Show"}</Button>
            </div>
            <FieldError className="field-error">{errors.password}</FieldError>
            {!errors.password && strength && (<span className={`auth-strength is-${strength}`}>Password strength: {STRENGTH_LABEL[strength]}</span>)}
          </TextField>

          <TextField name="confirmPassword" type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(v) => update("confirmPassword", v)} isInvalid={!!errors.confirmPassword} isRequired className="grid gap-2">
            <Label className={LABEL}>Confirm password<span className="text-error" aria-hidden="true">*</span></Label>
            <div className="relative">
              <Input autoComplete="new-password" className={INPUT + " pr-16"} />
              <Button type="button" onPress={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 min-h-6 min-w-11 grid place-items-center px-2 border-0 bg-transparent text-blue-600 text-[11px] font-bold cursor-pointer">{showConfirm ? "Hide" : "Show"}</Button>
            </div>
            <FieldError className="field-error">{errors.confirmPassword}</FieldError>
          </TextField>

          <label htmlFor="reg-privacy" className="check-row">
            <input id="reg-privacy" type="checkbox" checked={form.privacyConsent} onChange={(e) => update("privacyConsent", e.target.checked)} aria-describedby={errors.privacyConsent ? "reg-privacy-error" : undefined} />
            <span>I agree to the <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a> and the processing of my application data.</span>
          </label>
          {errors.privacyConsent && <p id="reg-privacy-error" className="field-error" role="alert">{errors.privacyConsent}</p>}

          <Button type="submit" isDisabled={status === "loading"} className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-[13px] rounded-lg border border-transparent bg-blue-600 text-white font-semibold text-[15px] transition hover:bg-blue-700 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
            {status === "loading" ? "Creating account..." : "Create account"}
          </Button>

          <p className="auth-footer-links">
            Already have an account?{" "}
            <a href="/login">Sign in</a>
          </p>
        </form>
      </div>
    </main>
  );
}
