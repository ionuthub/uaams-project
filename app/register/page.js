// app/register/page.js
// Route: /register (issue #8).
//
// PR review update: nationality, study level and the privacy-consent
// checkbox have been removed from this screen. They were being collected
// and validated but never persisted or recorded anywhere, which means
// students would have been required to fill in fields (including a
// consent checkbox with no actual privacy-policy page behind it) that
// were silently discarded. Re-add them once Dawid and Silvana approve a
// schema change for nationality/studyLevel on /users, and once a real
// privacy-policy page exists to link consent to.

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
  email: "",
  password: "",
  confirmPassword: "",
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

    if (fullNameErr) next.fullName = fullNameErr;
    if (emailErr) next.email = emailErr;
    if (passwordErr) next.password = passwordErr;
    if (confirmErr) next.confirmPassword = confirmErr;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setStatus("loading");
    try {
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
