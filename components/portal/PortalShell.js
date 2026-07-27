"use client";

import { useState } from "react";
import { logout } from "../../lib/auth";

// Shared portal shell (sidebar + main) for every signed-in area.
//
// Desktop: a fixed 248px sidebar.
// Mobile (below 900px): the sidebar becomes a compact bar showing only the
// brand and a hamburger. Everything from the sidebar (navigation, footer
// links, the user chip and log out) collapses behind that button, so the
// header stays readable on a phone instead of wrapping onto several rows.
const STUDENT_NAV = [
  { key: "dashboard", label: "My applications", href: "/student" },
  { key: "apply", label: "New application", href: "/apply" },
];

const NAV_ITEM =
  "flex items-center px-3 py-[11px] rounded-lg text-side-text no-underline text-sm font-medium cursor-pointer transition-colors hover:bg-white/[0.06] hover:text-white";
const NAV_CURRENT = NAV_ITEM + " bg-white/[0.11] text-white";

export default function PortalShell({
  user,
  current,
  children,
  nav = STUDENT_NAV,
  subtitle = "Applicant portal",
  roleLabel = "Applicant",
  footerLinks = [{ label: "Privacy", href: "/privacy" }],
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const who = user?.displayName || user?.email || roleLabel;
  const avatar = who.slice(0, 2).toUpperCase();

  async function handleLogout() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[248px_1fr] text-ink font-ui leading-[1.6] max-[900px]:grid-cols-1">
      <aside className="min-h-screen px-4 pt-[26px] pb-5 flex flex-col bg-navy-900 text-side-text max-[900px]:min-h-0 max-[900px]:px-[18px] max-[900px]:py-3">
        <div className="flex items-center gap-3 mb-7 px-1.5 max-[900px]:mb-0 max-[900px]:px-0 [&_strong]:block [&_strong]:text-white [&_strong]:text-[15px] [&_strong]:tracking-[0.08em] [&_small]:text-side-quiet [&_small]:text-xs">
          <span className="w-[38px] h-[38px] shrink-0 grid place-items-center rounded-[50%_50%_46%_46%] text-white bg-blue-600 font-editorial text-xl">U</span>
          <div>
            <strong>UAAMS</strong>
            <small>{subtitle}</small>
          </div>

          <button
            type="button"
            className="hidden max-[900px]:grid place-items-center ml-auto w-11 h-11 rounded-lg border-0 bg-transparent text-side-text cursor-pointer transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-expanded={menuOpen}
            aria-controls="portal-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        <div
          id="portal-menu"
          className={
            "flex flex-col flex-1 " +
            (menuOpen ? "max-[900px]:pt-3" : "max-[900px]:hidden")
          }
        >
          <nav className="flex flex-col gap-1" aria-label="Portal navigation">
            {nav.map((item) => (
              <a
                key={item.key}
                className={item.key === current ? NAV_CURRENT : NAV_ITEM}
                href={item.href}
                aria-current={item.key === current ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-1.5 pt-[18px] max-[900px]:mt-0 max-[900px]:pt-2">
            {/* Signed-in users had no route back to the public site: the portal was a
                dead end apart from signing out. Matches the "Back to UAAMS" control
                on the auth screens. */}
            <a className={NAV_ITEM} href="/">
              <span aria-hidden="true">&larr;</span> Back to UAAMS
            </a>
            {footerLinks.map((link) => (
              <a key={link.href} className={NAV_ITEM} href={link.href}>{link.label}</a>
            ))}
            <div className="flex items-center gap-3 px-2 py-2.5 [&_strong]:block [&_strong]:max-w-[150px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-white [&_strong]:text-[13px] [&_small]:text-side-quiet [&_small]:text-xs">
              <span className="w-[38px] h-[38px] shrink-0 grid place-items-center rounded-full text-white bg-blue-600 text-[13px] font-semibold">{avatar}</span>
              <div>
                <strong title={who}>{who}</strong>
                <small>{roleLabel}</small>
              </div>
            </div>
            <button
              className="text-left border-0 bg-transparent px-3 py-[11px] rounded-lg text-side-text text-sm font-medium cursor-pointer transition-colors hover:bg-white/[0.06] hover:text-white"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-warm-50">{children}</main>
    </div>
  );
}
