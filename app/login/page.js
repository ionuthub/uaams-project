// app/login/page.js
// Route: /login (issue #8, Figure A.2).
//
// Uses the designed two-column auth-shell layout (navy story panel + form)
// while keeping the real login logic: validation, role-aware redirect and
// the verification gate. No prefilled credentials, unlike the prototype.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, getUserProfile } from "../../lib/auth";
import { validateEmail, validateRequired, mapAuthErrorToMessage } from "../../lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | error
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
      let destination = "/student";
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.role === "admin") destination = "/admin";
      } catch {
        // profile lookup is a routing nicety; the dashboard guards handle the rest
      }
      router.push(destination);
    } catch (err) {
      console.error("Login failed:", err);
      setServerError(mapAuthErrorToMessage(err.code || err.message));
      setStatus("error");
    }
  }

  return (
    <main className="auth-shell" aria-labelledby="login-title">
      <aside className="auth-story">
        <div className="auth-story-main">
          <a className="back-link light-link" href="/">
            <span aria-hidden="true">←</span> Back to UAAMS
          </a>
          <span className="brand-mark light-mark" aria-hidden="true">U</span>
          <p className="eyebrow">Applicant and staff portal</p>
          <h2>One secure sign-in for all your applications.</h2>
          <p>Follow status updates, respond to document requests and view decisions in one place.</p>
        </div>
      </aside>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-heading">
            <p className="eyebrow">Sign in</p>
            <h1 id="login-title">Welcome back to UAAMS</h1>
            <p>Enter your account credentials to reach your applicant or staff portal.</p>
          </div>

          {status === "error" && serverError && (
            <div className="auth-alert is-error" role="alert">{serverError}</div>
          )}

          <label htmlFor="login-email">
            <span className="label-text">Email address<span className="req" aria-hidden="true">*</span></span>
            <input
              id="login-email"
              type="email"
              value={email}
              autoComplete="email"
              aria-invalid={!!errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => (prev.email ? { ...prev, email: null } : prev));
              }}
            />
            {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
          </label>

          <label htmlFor="login-password">
            <span className="label-text">Password<span className="req" aria-hidden="true">*</span></span>
            <span className="password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
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
          </label>

          <p className="auth-inline-link">
            <a href="/reset-password">Forgot password?</a>
          </p>

          <button className="button button-primary button-large button-full" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-footer-links">
            Do not have an account?{" "}
            <a href="/register">Create one</a>
          </p>
        </form>
      </div>
    </main>
  );
}
