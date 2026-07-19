"use client";

export default function PublicHeader({ setScreen, currentScreen, user, onSignOut }) {
  return (
    <header className="public-header" data-public-header>
      <button
        className="brand"
        type="button"
        onClick={() => setScreen("landing")}
        aria-label="UAAMS home"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <span className="brand-mark">U</span>
        <span className="brand-name">UAAMS</span>
      </button>

      <nav className="public-nav" aria-label="Primary navigation">
        <button
          className={currentScreen === "universities" ? "is-current" : ""}
          type="button"
          onClick={() => setScreen("universities")}
          aria-current={currentScreen === "universities" ? "page" : undefined}
        >
          Universities
        </button>

        <button
          className={currentScreen === "courses" ? "is-current" : ""}
          type="button"
          onClick={() => setScreen("courses")}
          aria-current={currentScreen === "courses" ? "page" : undefined}
        >
          Courses
        </button>

        <button
          className={currentScreen === "landing" ? "is-current" : ""}
          type="button"
          onClick={() => {
            setScreen("landing");
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
          onClick={() => setScreen("support")}
          aria-current={currentScreen === "support" ? "page" : undefined}
        >
          Support
        </button>
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            <button className="button button-quiet" type="button" onClick={() => setScreen("dashboard")}>
              Portal Dashboard
            </button>
            <button className="button button-secondary" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button className="button button-quiet" type="button" onClick={() => setScreen("login")}>
              Sign in
            </button>
            <button className="button button-primary" type="button" onClick={() => setScreen("register")}>
              Create account
            </button>
          </>
        )}
      </div>
    </header>
  );
}
