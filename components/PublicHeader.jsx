"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "../lib/auth";

export default function PublicHeader({ setScreen, currentScreen, user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState(null);

  // The header only receives the auth user, not the profile. Look up the role
  // so the signed-in actions can point admins at the real /admin queue instead
  // of always sending everyone to the student dashboard.
  useEffect(() => {
    if (!user) {
      setRole(null);
      return undefined;
    }
    let active = true;
    getUserProfile(user.uid)
      .then((profile) => {
        if (active) setRole(profile?.role || "student");
      })
      .catch(() => {
        if (active) setRole("student");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const go = (action) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className={menuOpen ? "public-header is-mobile-open" : "public-header"} data-public-header>
      <button
        className="brand"
        type="button"
        onClick={() => go(() => setScreen("landing"))}
        aria-label="UAAMS home"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <span className="brand-mark">U</span>
        <span className="brand-name">UAAMS</span>
      </button>

      <button
        className="mobile-menu"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="public-header-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      <nav className="public-nav" id="public-header-nav" aria-label="Primary navigation">
        <button
          className={currentScreen === "universities" ? "is-current" : ""}
          type="button"
          onClick={() => go(() => setScreen("universities"))}
          aria-current={currentScreen === "universities" ? "page" : undefined}
        >
          Universities
        </button>

        <button
          className={currentScreen === "courses" ? "is-current" : ""}
          type="button"
          onClick={() => go(() => setScreen("courses"))}
          aria-current={currentScreen === "courses" ? "page" : undefined}
        >
          Courses
        </button>

        <button
          className={currentScreen === "landing" ? "is-current" : ""}
          type="button"
          onClick={() => {
            go(() => setScreen("landing"));
            setTimeout(() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
        >
          How it works
        </button>

        <button
          className={currentScreen === "support" ? "is-current" : ""}
          type="button"
          onClick={() => go(() => setScreen("support"))}
          aria-current={currentScreen === "support" ? "page" : undefined}
        >
          Support
        </button>
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            {role === "admin" && (
              <button className="button button-quiet" type="button" onClick={() => go(() => { window.location.href = "/admin"; })}>
                Admin queue
              </button>
            )}
            <button className="button button-quiet" type="button" onClick={() => go(() => { window.location.href = "/student"; })}>
              Student Dashboard
            </button>
            <button className="button button-secondary" type="button" onClick={() => go(onSignOut)}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button className="button button-quiet" type="button" onClick={() => go(() => { window.location.href = "/login"; })}>
              Sign in
            </button>
            <button className="button button-primary" type="button" onClick={() => go(() => { window.location.href = "/register"; })}>
              Create account
            </button>
          </>
        )}
      </div>
    </header>
  );
}
