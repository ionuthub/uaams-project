// app/register/page.js
// Route: /register (issue #8).
//
// Data-model note: nationality and studyLevel are collected and validated
// here (per the PRD / Sprint 1 wireframe, Figure A.1) but are NOT sent to
// registerStudent() / persisted to Firestore yet. registerStudent() is
// unchanged from develop. Adding these fields to /users needs Dawid and
// Silvana to sign off against firestore.rules and the schema doc first -
// see the PR description "Data-model decision". Once approved, wiring them
// in is a one-line change here.
//
// Privacy-policy link: removed. /privacy-policy doesn't exist in the repo;
// linking a 404 from a legal-consent checkbox is worse than plain text.
// Add the real link back in once that page/URL exists.

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
  validateConsent,
  mapAuthErrorToMessage,
} from "../../lib/validation";
import styles from "../../components/auth/auth.module.css";

const STUDY_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate-taught", label: "Postgraduate (taught)" },
  { value: "postgraduate-research", label: "Postgraduate (research)" },
];

const INITIAL_STATE = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  nationality: "",
  studyLevel: "undergraduate",
  consentAccepted: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState(null);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next = {};
    const fullNameErr = validateRequired(form.fullName, "Full name");
    const emailErr = validateEmail(form.email);
    const passwordErr = validatePassword(form.password);
    const confirmErr = validateConfirmPassword(form.password, form.confirmPassword);
    const nationalityErr = validateRequired(form.nationality, "Nationality");
    const consentErr = validateConsent(form.consentAccepted);

    if (fullNameErr) next.fullName = fullNameErr;
    if (emailErr) next.email = emailErr;
    if (passwordErr) next.password = passwordErr;
    if (confirmErr) next.confirmPassword = confirmErr;
    if (nationalityErr) next.nationality = nationalityErr;
    if (consentErr) next.consentAccepted = consentErr;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setStatus("loading");
    try {
      // NOTE: nationality / studyLevel / consentAccepted are validated above
      // but deliberately not passed through - see the file header comment.
      await registerStudent(form.email.trim(), form.password, form.fullName.trim());
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
        <FormField
          label="Nationality"
          name="nationality"
          value={form.nationality}
          onChange={(e) => update("nationality", e.target.value)}
          error={errors.nationality}
          autoComplete="country-name"
        />

        <div className={styles.field}>
          <label htmlFor="studyLevel" className={styles.label}>
            Intended level of study
          </label>
          <select
            id="studyLevel"
            name="studyLevel"
            value={form.studyLevel}
            onChange={(e) => update("studyLevel", e.target.value)}
            className={styles.select}
          >
            {STUDY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <div className={styles.checkboxRow}>
            <input
              id="consentAccepted"
              type="checkbox"
              checked={form.consentAccepted}
              onChange={(e) => update("consentAccepted", e.target.checked)}
              aria-describedby={errors.consentAccepted ? "consentAccepted-error" : undefined}
              className={styles.checkbox}
            />
            <label htmlFor="consentAccepted" className={styles.checkboxLabel}>
              I have read and accept the privacy policy.
            </label>
          </div>
          {errors.consentAccepted && (
            <p id="consentAccepted-error" role="alert" className={styles.errorText}>
              {errors.consentAccepted}
            </p>
          )}
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
