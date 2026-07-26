// app/login/page.js
// Route: /login (issue #8, Figure A.2).
//
// Migration step: the form controls use React Aria (TextField / Button) for
// accessibility, styled with Tailwind utilities. The two-column auth shell
// layout stays on the shared global classes for now; it is converted in the
// coordinated auth-layout pass so all auth pages move together.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Label, Input, FieldError, Button } from "react-aria-components";
import { login, getUserProfile } from "../../lib/auth";
import { validateEmail, validateRequired, mapAuthErrorToMessage } from "../../lib/validation";

const INPUT = "w-full min-h-12 px-[13px] py-[11px] border border-border-strong rounded-[7px] text-ink bg-white outline-0 focus:border-blue-600 focus:shadow-[0_0_0_3px_var(--color-blue-100)]";

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

          <TextField
            name="email"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); setErrors((prev) => (prev.email ? { ...prev, email: null } : prev)); }}
            isInvalid={!!errors.email}
            className="grid gap-2"
          >
            <Label className="!flex items-center gap-1">Email address<span className="text-error" aria-hidden="true">*</span></Label>
            <Input autoComplete="email" className={INPUT} />
            <FieldError className="field-error">{errors.email}</FieldError>
          </TextField>

          <TextField
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(v) => { setPassword(v); setErrors((prev) => (prev.password ? { ...prev, password: null } : prev)); }}
            isInvalid={!!errors.password}
            className="grid gap-2"
          >
            <Label className="!flex items-center gap-1">Password<span className="text-error" aria-hidden="true">*</span></Label>
            <div className="relative">
              <Input autoComplete="current-password" className={INPUT + " pr-16"} />
              <Button
                type="button"
                onPress={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-blue-600 text-[11px] font-bold cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <FieldError className="field-error">{errors.password}</FieldError>
          </TextField>

          <p className="auth-inline-link">
            <a href="/reset-password">Forgot password?</a>
          </p>

          <Button
            type="submit"
            isDisabled={status === "loading"}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-[13px] rounded-lg border border-transparent bg-blue-600 text-white font-semibold text-[15px] transition hover:bg-blue-700 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Signing in..." : "Sign in"}
          </Button>

          <p className="auth-footer-links">
            Do not have an account?{" "}
            <a href="/register">Create one</a>
          </p>
        </form>
      </div>
    </main>
  );
}
