"use client";

import { logout } from "../../lib/auth";
import styles from "./portal.module.css";

// Applicant portal navigation. Only routes that actually exist are listed here,
// so nothing links to a screen that has not been built.
const NAV = [
  { key: "dashboard", label: "My applications", href: "/student" },
  { key: "apply", label: "New application", href: "/apply" },
];

// Shared shell for the signed-in applicant portal: fixed sidebar (brand, nav,
// real user profile, log out) plus a main content area. Pages pass their own
// content as children and mark the active nav item with `current`.
export default function PortalShell({ user, current, children }) {
  const who = user?.displayName || user?.email || "Applicant";
  const avatar = who.slice(0, 2).toUpperCase();

  // Signing out is a deliberate action, not an error. Redirect to the login
  // screen as soon as Firebase clears the session, so the applicant never lands
  // on a signed-out page rendering its "please sign in" error state.
  async function handleLogout() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>U</span>
          <div>
            <strong>UAAMS</strong>
            <small>Applicant portal</small>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Applicant navigation">
          {NAV.map((item) => (
            <a
              key={item.key}
              className={item.key === current ? styles.navCurrent : styles.navItem}
              href={item.href}
              aria-current={item.key === current ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <a className={styles.navItem} href="/privacy">Privacy</a>
          <div className={styles.userChip}>
            <span className={styles.userAvatar}>{avatar}</span>
            <div>
              <strong title={who}>{who}</strong>
              <small>Applicant</small>
            </div>
          </div>
          <button className={styles.logout} type="button" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
