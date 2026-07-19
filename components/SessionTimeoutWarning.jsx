"use client";

import { useState, useEffect } from "react";

/**
 * SessionTimeoutWarning Component
 * Implements WCAG 2.2 Success Criterion 2.2.1 (Timing Adjustable).
 * Gives applicants a clear 2-minute warning to extend their session before logging out.
 */
export default function SessionTimeoutWarning({ user, onSignOut, onExtendSession }) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    // Timer to trigger warning after inactivity (e.g. 10 minutes demo)
    let inactivityTimer = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(120);
    }, 10 * 60 * 1000);

    return () => clearTimeout(inactivityTimer);
  }, [user]);

  useEffect(() => {
    if (!showWarning) return;

    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          onSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning, onSignOut]);

  if (!showWarning || !user) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <dialog
      className="modal"
      open
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-desc"
      role="alertdialog"
      style={{ display: "block", zIndex: 9999 }}
    >
      <div className="modal-body" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span style={{ fontSize: "24px" }}>🕒</span>
          <div>
            <p className="micro-label" style={{ color: "var(--warning)" }}>Session Timeout Warning (WCAG 2.2 SC 2.2.1)</p>
            <h2 id="session-warning-title" style={{ margin: 0 }}>Your session is about to expire</h2>
          </div>
        </div>

        <p id="session-warning-desc">
          To protect your sensitive application data, your session will automatically end in{" "}
          <strong style={{ color: "var(--error)", fontSize: "18px" }}>{minutes}:{secs}</strong>.
          Would you like to stay signed in and keep working?
        </p>

        <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            className="button button-quiet"
            type="button"
            onClick={onSignOut}
          >
            Sign out now
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              setShowWarning(false);
              if (onExtendSession) onExtendSession();
            }}
          >
            Extend session
          </button>
        </div>
      </div>
    </dialog>
  );
}
