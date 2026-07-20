"use client";

import { useState } from "react";

export default function PublicHeader({ setScreen, currentScreen, user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
            <button className="button button-quiet" type="button" onClick={() => go(() => setScreen("dashboard"))}>
              Portal Dashboard
            </button>
            <button className="button button-secondary" type="button" onClick={() => go(onSignOut)}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button className="button button-quiet" type="button" onClick={() => go(() => setScreen("login"))}>
              Sign in
            </button>
            <button className="button button-primary" type="button" onClick={() => go(() => setScreen("register"))}>
              Create account
            </button>
          </>
        )}
      </div>
    </header>
  );
}
