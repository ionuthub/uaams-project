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
  { key: "home", label: "Home", href: "/" },
  {
    key: "student-dashboard",
    label: "Dashboard",
    children: [
      { key: "dashboard", label: "My applications", href: "/student" },
      { key: "apply", label: "New application", href: "/apply" },
    ],
  },
];

// min-h-[44px] keeps every target at the size WCAG 2.5.8 asks for, and the
// focus-visible ring replaces the outline browsers drop on custom styling.
const NAV_BASE =
  "relative flex items-center w-full px-3 min-h-[44px] rounded-lg text-side-text no-underline text-sm font-medium cursor-pointer transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
// Figma sidebar: the current item sits in a lighter rounded box with a short
// accent bar on its left edge.
const NAV_ACCENT =
  " bg-white/[0.11] text-white before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-full before:bg-blue-400";
const NAV_ITEM = NAV_BASE;
const NAV_CURRENT = NAV_BASE + NAV_ACCENT;
// Count badge on the right of a nav item (live numbers only, passed by pages).
const NAV_BADGE =
  "ml-auto min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-white/[0.16] text-white text-[11px] font-semibold";
// Children sit on an indent rather than an icon, so the level is still legible
// without relying on graphics.
// Dashboard names the group; it is not a control. aria-labelledby ties it to the
// list below so the grouping is announced without implying something clickable.
const NAV_GROUP_LABEL =
  "block px-3 pt-4 pb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-side-quiet";
const NAV_CHILD = NAV_BASE + " text-[0.85rem] font-normal";
const NAV_CHILD_CURRENT = NAV_CHILD + NAV_ACCENT + " font-medium";

// #241: a disabled nav child (e.g. Payments, ahead of the payments feature
// itself) keeps the same size and spacing so the sidebar doesn't jump, but
// drops the hover/focus affordances and dims the text - it should read as
// present-but-not-yet, not as a broken link.
const NAV_CHILD_DISABLED = NAV_CHILD.replace("cursor-pointer", "cursor-default").replace(
  "hover:bg-white/[0.06] hover:text-white",
  "opacity-50"
);
const NAV_SOON_BADGE =
  "ml-auto px-1.5 h-5 grid place-items-center rounded-full bg-white/[0.10] text-side-quiet text-[10px] font-semibold uppercase tracking-[0.04em]";

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

  // #196: staff and applicants now have separate sign-in routes, so send
  // people back to the door they came in through. Derived from the current
  // path rather than a prop so no call site can be missed - an admin bounced
  // to /login would simply be refused there.
  async function handleLogout() {
    const inAdminArea =
      typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
    await logout();
    window.location.assign(inAdminArea ? "/admin/login" : "/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[248px_1fr] text-ink font-ui leading-[1.6] max-[900px]:grid-cols-1">
      <aside className="min-h-screen px-4 pt-[26px] pb-5 flex flex-col bg-navy-900 text-side-text max-[900px]:min-h-0 max-[900px]:px-5 max-[900px]:pt-3 max-[900px]:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
            (menuOpen ? "max-[900px]:pt-5 max-[900px]:pb-2" : "max-[900px]:hidden")
          }
        >
          <nav className="flex flex-col gap-1" aria-label="Portal sections">
            <ul className="list-none m-0 p-0 flex flex-col gap-1">
              {nav.map((item) =>
                item.children ? (
                  <li key={item.key}>
                    <span
                      id={"nav-label-" + item.key}
                      className={NAV_GROUP_LABEL}
                    >
                      {item.label}
                    </span>
                    <ul
                      aria-labelledby={"nav-label-" + item.key}
                      className="list-none m-0 p-0 mt-1 mb-1 ml-[1.4rem] pl-3 border-l border-white/20 flex flex-col gap-1"
                    >
                      {item.children.map((child) => (
                        <li key={child.key}>
                          {child.disabled ? (
                            // #241: no href, so a click can never navigate and never
                            // fires a request - this is the only thing that makes an
                            // "inactive" nav entry actually inactive.
                            <span className={NAV_CHILD_DISABLED} aria-disabled="true">
                              {child.label}
                              {child.badgeLabel && (
                                <span className={NAV_SOON_BADGE}>{child.badgeLabel}</span>
                              )}
                            </span>
                          ) : (
                            <a
                              className={child.key === current ? NAV_CHILD_CURRENT : NAV_CHILD}
                              href={child.href}
                              aria-current={child.key === current ? "page" : undefined}
                            >
                              {child.label}
                              {child.badge != null && (
                                <span className={NAV_BADGE} aria-label={child.badge + " items"}>{child.badge}</span>
                              )}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={item.key}>
                    <a
                      className={item.key === current ? NAV_CURRENT : NAV_ITEM}
                      href={item.href}
                      aria-current={item.key === current ? "page" : undefined}
                    >
                      {item.label}
                      {item.badge != null && (
                        <span className={NAV_BADGE} aria-label={item.badge + " items"}>{item.badge}</span>
                      )}
                    </a>
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-1.5 pt-[18px] border-t border-white/10 max-[900px]:mt-6 max-[900px]:pt-4 max-[900px]:border-t max-[900px]:border-white/10">
            <nav aria-label="Account">
              <ul className="list-none m-0 p-0 flex flex-col gap-1">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <a className={NAV_ITEM} href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 [&_strong]:block [&_strong]:max-w-[150px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-white [&_strong]:text-[13px] [&_small]:text-side-quiet [&_small]:text-xs">
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
