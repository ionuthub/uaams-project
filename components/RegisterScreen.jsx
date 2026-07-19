"use client";

import { useState } from "react";
import { registerStudent } from "../lib/auth";

export default function RegisterScreen({ setScreen, onRegisterSuccess, notify }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("British");
  const [studyLevel, setStudyLevel] = useState("Bachelor");
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreePrivacy) {
      setErrorMsg("You must accept the privacy policy to register.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const user = await registerStudent(email, password, name, {
        nationality,
        studyLevel,
      });
      notify("Account Created", "A verification email has been sent to your inbox.");
      if (onRegisterSuccess) onRegisterSuccess(user);
      setScreen("verify-email");
    } catch (err) {
      setErrorMsg(err.message || "Could not complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="screen is-active" data-screen="register" aria-labelledby="register-title">
      <div className="auth-shell">
        <aside className="auth-story">
          <div className="auth-story-main">
            <button className="back-link light-link" type="button" onClick={() => setScreen("landing")}>
              ← Back to UAAMS
            </button>
            <span className="brand-mark light-mark">U</span>
            <p className="eyebrow">Create your account</p>
            <h2>Start your university journey with confidence.</h2>
            <p>One account lets you apply to multiple universities, upload evidence securely and track outcomes.</p>
          </div>
        </aside>

        <div className="auth-panel">
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <div className="auth-heading">
              <p className="eyebrow">Create account</p>
              <h1 id="register-title">Register as an applicant</h1>
              <p id="reg-instruction">
                Please complete all fields below. Upfront password and requirement details are provided per field.
              </p>
            </div>

            {errorMsg && (
              <div
                id="register-error"
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

            <label htmlFor="reg-name">
              <span className="label-text">
                Full legal name <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
              </span>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amara Osei"
                aria-required="true"
                aria-invalid={!!errorMsg && !name}
                aria-describedby={errorMsg ? "register-error reg-instruction" : "reg-instruction"}
                required
              />
            </label>

            <label htmlFor="reg-email" style={{ marginTop: "14px" }}>
              <span className="label-text">
                Email address <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
              </span>
              <p id="reg-email-hint" className="field-hint" style={{ margin: "4px 0 6px", fontSize: "13px", color: "var(--muted)" }}>
                We will send verification links and decision updates to this address.
              </p>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-required="true"
                aria-invalid={!!errorMsg && !email}
                aria-describedby="reg-email-hint"
                required
              />
            </label>

            <label htmlFor="reg-password" style={{ marginTop: "14px" }}>
              <span className="label-text">
                Password <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
              </span>
              <p id="reg-password-hint" className="field-hint" style={{ margin: "4px 0 6px", fontSize: "13px", color: "var(--muted)" }}>
                Must be at least 6 characters long containing letters and numbers.
              </p>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                aria-required="true"
                aria-invalid={!!errorMsg && password.length < 6}
                aria-describedby="reg-password-hint"
                required
              />
            </label>

            <div className="field-grid" style={{ marginTop: "14px" }}>
              <label htmlFor="reg-nationality">
                <span className="label-text">
                  Nationality <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
                </span>
                <select
                  id="reg-nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  aria-required="true"
                  required
                >
                  <option value="British">British</option>
                  <option value="Nigerian">Nigerian</option>
                  <option value="Indian">Indian</option>
                  <option value="German">German</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label htmlFor="reg-level">
                <span className="label-text">
                  Intended level of study <span style={{ color: "var(--error)", marginLeft: "4px" }}>*</span>
                </span>
                <select
                  id="reg-level"
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value)}
                  aria-required="true"
                  required
                >
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="PhD">PhD</option>
                </select>
              </label>
            </div>

            <label htmlFor="reg-privacy" className="check-row" style={{ marginTop: "16px", cursor: "pointer" }}>
              <input
                id="reg-privacy"
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                aria-required="true"
                required
              />
              <span>I accept the UAAMS privacy policy and terms of service.</span>
            </label>

            <button
              className="button button-primary button-large button-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: "20px" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div className="auth-footer-links" style={{ marginTop: "16px", textAlign: "center" }}>
              <span style={{ color: "var(--muted)", fontSize: "14px" }}>Already have an account? </span>
              <button
                type="button"
                className="text-button"
                onClick={() => setScreen("login")}
                style={{ color: "var(--blue-600)", fontWeight: 600, fontSize: "14px" }}
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
