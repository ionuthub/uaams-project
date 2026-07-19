"use client";

import { useState } from "react";
import { login, resendVerification } from "../lib/auth";
import { getAuthClient } from "../lib/firebase";

export default function LoginScreen({ setScreen, onLoginSuccess, notify }) {
  const [email, setEmail] = useState("amara.osei@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unverified, setUnverified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setUnverified(false);
    try {
      const res = await login(email, password);
      if (!res.verified) {
        setUnverified(true);
        notify("Email Unverified", "Please verify your email address to access all portal features.");
      } else {
        notify("Welcome back", `Signed in successfully as ${res.user.email}`);
      }
      if (onLoginSuccess) onLoginSuccess(res.user);
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const auth = getAuthClient();
      if (auth.currentUser) {
        await resendVerification(auth.currentUser);
        notify("Verification Sent", "A new verification link has been sent to your inbox.");
      } else {
        notify("Action Required", "Please sign in first to resend the verification link.");
      }
    } catch (err) {
      notify("Error", err.message);
    }
  };

  return (
    <section className="screen is-active" data-screen="login" aria-labelledby="login-title">
      <div className="auth-shell">
        <aside className="auth-story">
          <div className="auth-story-main">
            <button className="back-link light-link" type="button" onClick={() => setScreen("landing")}>
              ← Back to UAAMS
            </button>
            <span className="brand-mark light-mark">U</span>
            <p className="eyebrow">Applicant & staff portal</p>
            <h2>One secure sign-in for all your applications.</h2>
            <p>Follow status updates, respond to document requests and view decisions across all universities.</p>
          </div>
        </aside>

        <div className="auth-panel">
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <div className="auth-heading">
              <p className="eyebrow">Sign in</p>
              <h1 id="login-title">Welcome back to UAAMS</h1>
              <p id="login-instructions">
                Enter your account credentials to access your applicant or staff portal.
              </p>
            </div>

            {errorMsg && (
              <div
                id="login-error"
                role="alert"
                aria-live="assertive"
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--error-bg)",
                  color: "var(--error)",
                  fontSize: "14px",
                  marginBottom: "16px",
                  fontWeight: 500,
                }}
              >
                {errorMsg}
              </div>
            )}

            {unverified && (
              <div
                id="unverified-warning"
                role="region"
                aria-live="polite"
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--warning-bg)",
                  color: "var(--warning)",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}
              >
                <strong>Verification Required:</strong> Your email has not been verified yet.
                <button
                  type="button"
                  className="text-button"
                  onClick={handleResend}
                  style={{ display: "block", marginTop: "6px" }}
                >
                  Resend verification email →
                </button>
              </div>
            )}

            <label htmlFor="login-email">
              <span className="label-text">
                Email address <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? "login-error login-instructions" : "login-instructions"}
                required
              />
            </label>

            <label htmlFor="login-password" style={{ marginTop: "16px" }}>
              <span className="label-text">
                Password <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
              </span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? "login-error login-instructions" : "login-instructions"}
                required
              />
            </label>

            <button
              className="button button-primary button-large button-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: "20px" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="auth-footer-links" style={{ marginTop: "16px", textAlign: "center" }}>
              <span style={{ color: "var(--muted)", fontSize: "14px" }}>Need an account? </span>
              <button
                type="button"
                className="text-button"
                onClick={() => setScreen("register")}
                style={{ color: "var(--blue-600)", fontWeight: 600, fontSize: "14px" }}
              >
                Create one
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
