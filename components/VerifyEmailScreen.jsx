"use client";

import { resendVerification } from "../lib/auth";
import { getAuthClient } from "../lib/firebase";

export default function VerifyEmailScreen({ setScreen, user, notify }) {
  const handleResend = async () => {
    try {
      const auth = getAuthClient();
      if (auth.currentUser) {
        await resendVerification(auth.currentUser);
        notify("Verification Sent", "A new verification email has been sent to your inbox.");
      } else {
        notify("Notice", "Please sign in to resend the verification email.");
        setScreen("login");
      }
    } catch (err) {
      notify("Error", err.message);
    }
  };

  return (
    <section className="screen is-active" data-screen="verify-email">
      <div className="auth-shell auth-compact">
        <aside className="auth-story">
          <button className="back-link light-link" type="button" onClick={() => setScreen("landing")}>
            ← Back to UAAMS
          </button>
          <div>
            <span className="brand-mark light-mark">U</span>
            <p className="eyebrow">Secure account setup</p>
            <h2>One quick check protects your applications.</h2>
            <p>We verify every applicant email before personal information or documents can be submitted.</p>
          </div>
        </aside>

        <div className="auth-panel">
          <section className="auth-card verification-card">
            <span className="verification-icon" aria-hidden="true">✉</span>
            <div className="auth-heading">
              <p className="eyebrow">Check your inbox</p>
              <h1 id="verify-email-title">Verify your email address</h1>
              <p>
                We sent a verification link to <strong>{user?.email || "your email address"}</strong>.
              </p>
            </div>

            <div className="verification-guidance">
              <strong>Didn’t receive it?</strong>
              <ul>
                <li>Check your spam or junk folder.</li>
                <li>Confirm that your email address is correct.</li>
                <li>Wait a minute before requesting another link.</li>
              </ul>
            </div>

            <button
              className="button button-primary button-full"
              type="button"
              onClick={() => setScreen("dashboard")}
            >
              I have verified my email (Proceed to Portal)
            </button>

            <button
              className="button button-secondary button-full"
              type="button"
              onClick={handleResend}
            >
              Resend verification email
            </button>

            <button
              className="text-button"
              type="button"
              onClick={() => setScreen("register")}
            >
              Use a different email address
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}
