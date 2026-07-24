"use client";

import { logout } from "../../lib/auth";
import styles from "./portal.module.css";

// Shared portal shell (sidebar + main) for every signed-in area. Defaults
// render the applicant portal exactly as before; the admin screens reuse the
// same shell by passing their own nav, subtitle, role label and footer links,
// so there is a single shell implementation rather than one per role.
const STUDENT_NAV = [
  { key: "dashboard", label: "My applications", href: "/student" },
  { key: "apply", label: "New application", href: "/apply" },
];

export default function PortalShell({
  user,
  current,
  children,
  nav = STUDENT_NAV,
  subtitle = "Applicant portal",
  roleLabel = "Applicant",
  footerLinks = [{ label: "Privacy", href: "/privacy" }],
}) {
  const who = user?.displayName || user?.email || roleLabel;
  const avatar = who.slice(0, 2).toUpperCase();

  // Signing out is a deliberate action, not an error. Redirect to the login
  // screen as soon as Firebase clears the session, so the user never lands on
  // a signed-out page rendering its "please sign in" error state.
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
            <small>{subtitle}</small>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Portal navigation">
          {nav.map((item) => (
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
          {footerLinks.map((link) => (
            <a key={link.href} className={styles.navItem} href={link.href}>{link.label}</a>
          ))}
          <div className={styles.userChip}>
            <span className={styles.userAvatar}>{avatar}</span>
            <div>
              <strong title={who}>{who}</strong>
              <small>{roleLabel}</small>
            </div>
          </div>
          <button className={styles.logout} type="button" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
