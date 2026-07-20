// app/register/page.js
// Route: /register (issue #8).
//
// PRD-required registration fields are persisted in the student profile.
// Privacy consent links to the in-app notice and records a server timestamp.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "../../components/auth/AuthCard";
import FormField from "../../components/auth/FormField";
import PasswordInput from "../../components/auth/PasswordInput";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import { registerStudent } from "../../lib/auth";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  mapAuthErrorToMessage,
} from "../../lib/validation";
import styles from "../../components/auth/auth.module.css";

const INITIAL_STATE = {
  fullName: "",
  nationality: "",
  studyLevel: "",
  email: "",
  password: "",
  confirmPassword: "",
  privacyConsent: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
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
      await registerStudent(form.email.trim(), form.password, form.fullName.trim(), form.nationality.trim(), form.studyLevel.trim());
      setStatus("success");
      router.push("/verify-email");
    } catch (err) {
      setServerError(mapAuthErrorToMessage(err.code));
      setStatus("error");
    }
  }

  return (
    <AuthCard
      title="Create your student account"
      subtitle="Register to start and track your university applications."
    >
      {status === "error" && serverError && (
        <AlertBanner variant="error">{serverError}</AlertBanner>
      )}
      {status === "success" && (
        <AlertBanner variant="success">
          Account created. Redirecting you to verify your email...
        </AlertBanner>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          error={errors.fullName}
          autoComplete="name"
        />
        <FormField
          label="Nationality"
          name="nationality"
          value={form.nationality}
          onChange={(e) => update("nationality", e.target.value)}
          error={errors.nationality}
          autoComplete="country-name"
        />
        <FormField
          label="Intended study level"
          name="studyLevel"
          placeholder="e.g. Undergraduate"
          value={form.studyLevel}
          onChange={(e) => update("studyLevel", e.target.value)}
          error={errors.studyLevel}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <PasswordInput
          label="Password"
          name="password"
          value={form.password}
          onChange={(v) => update("password", v)}
          error={errors.password}
          showStrength
        />
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={(v) => update("confirmPassword", v)}
          error={errors.confirmPassword}
        />

        <div>
          <label>
            <input
              type="checkbox"
              checked={form.privacyConsent}
              onChange={(e) => update("privacyConsent", e.target.checked)}
              aria-describedby={errors.privacyConsent ? "privacyConsent-error" : undefined}
            />{" "}
            I agree to the <a href="/privacy" target="_blank" rel="noreferrer">privacy notice</a> and the processing of my application data.
          </label>
          {errors.privacyConsent && <p id="privacyConsent-error" role="alert" className={styles.errorText}>{errors.privacyConsent}</p>}
        </div>

        <LoadingButton loading={status === "loading"}>Create account</LoadingButton>
      </form>

      <p className={styles.footerText}>
        Already have an account?{" "}
        <a href="/login" className={styles.link}>
          Log in
        </a>
      </p>
    </AuthCard>
  );
}
