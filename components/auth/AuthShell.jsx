// components/auth/AuthShell.jsx
// Shared two-column auth layout: navy story panel on the left, form panel on
// the right. Matches the login and register routes so all four auth pages are
// consistent. The caller provides the story text and the .auth-card content.

"use client";

export default function AuthShell({ story, children }) {
  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <div className="auth-story-main">
          <a className="back-link light-link" href="/">
            <span aria-hidden="true">←</span> Back to UAAMS
          </a>
          <span className="brand-mark light-mark" aria-hidden="true">U</span>
          <p className="eyebrow">{story.eyebrow}</p>
          <h2>{story.headline}</h2>
          <p>{story.subtext}</p>
        </div>
      </aside>
      <div className="auth-panel">{children}</div>
    </main>
  );
}
