// app/login/page.js
// Route: /login (issue #8, Figure A.2).
//
// A verified applicant continues to the Week 2 student dashboard.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "../../components/auth/AuthCard";
import FormField from "../../components/auth/FormField";
import PasswordInput from "../../components/auth/PasswordInput";
import AlertBanner from "../../components/auth/AlertBanner";
import LoadingButton from "../../components/auth/LoadingButton";
import { login } from "../../lib/auth";
import { validateEmail, validateRequired, mapAuthErrorToMessage } from "../../lib/validation";
import styles from "../../components/auth/auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState(null);

  function validate() {
    const emailErr = validateEmail(email);
    const passwordErr = validateRequired(password, "Password");
    setErrors({ email: emailErr, password: passwordErr });
    return !emailErr && !passwordErr;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setStatus("loading");
    try {
      const { user, verified } = await login(email.trim(), password);
      if (!verified) {
        router.push("/verify-email");
        return;
      }
      router.push("/student");
    } catch (err) {
      setServerError(mapAuthErrorToMessage(err.code));
      setStatus("error");
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back - sign in to continue your application.">
      {status === "error" && serverError && (
        <AlertBanner variant="error">{serverError}</AlertBanner>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <PasswordInput
          label="Password"
          name="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <p style={{ textAlign: "right", margin: 0 }}>
          <a href="/reset-password" className={styles.link}>
            Forgot password?
          </a>
        </p>

        <LoadingButton loading={status === "loading"}>Log in</LoadingButton>
      </form>

      <p className={styles.footerText}>
        Don&apos;t have an account?{" "}
        <a href="/register" className={styles.link}>
          Register
        </a>
      </p>
    </AuthCard>
  );
}
