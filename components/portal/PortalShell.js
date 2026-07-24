"use client";

import { logout } from "../../lib/auth";

// Shared portal shell (sidebar + main) for every signed-in area. Styling is
// Tailwind utilities (migrated from portal.module.css). Desktop shows a fixed
// 248px sidebar; below 900px it collapses to a top bar. Defaults render the
// applicant portal; admin passes its own nav / labels / footer links.
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
  const who = user?.displayName || user?.email || roleLabel;
  const avatar = who.slice(0, 2).toUpperCase();

  async function handleLogout() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[248px_1fr] text-ink font-ui leading-[1.6] max-[900px]:grid-cols-1">
      <aside className="min-h-screen px-4 pt-[26px] pb-5 flex flex-col bg-navy-900 text-side-text max-[900px]:min-h-0 max-[900px]:flex-row max-[900px]:items-center max-[900px]:flex-wrap max-[900px]:gap-x-1.5 max-[900px]:gap-y-2 max-[900px]:px-[18px] max-[900px]:py-[14px]">
        <div className="flex items-center gap-3 mb-7 px-1.5 max-[900px]:mb-0 max-[900px]:mr-auto [&_strong]:block [&_strong]:text-white [&_strong]:text-[15px] [&_strong]:tracking-[0.08em] [&_small]:text-side-quiet [&_small]:text-xs">
          <span className="w-[38px] h-[38px] shrink-0 grid place-items-center rounded-[50%_50%_46%_46%] text-white bg-blue-600 font-editorial text-xl">U</span>
          <div>
            <strong>UAAMS</strong>
            <small>{subtitle}</small>
          </div>
        </div>

        <nav className="flex flex-col gap-1 max-[900px]:flex-row" aria-label="Portal navigation">
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

        <div className="mt-auto flex flex-col gap-1.5 pt-[18px] max-[900px]:mt-0 max-[900px]:flex-row max-[900px]:items-center max-[900px]:pt-0">
          {footerLinks.map((link) => (
            <a key={link.href} className={NAV_ITEM} href={link.href}>{link.label}</a>
          ))}
          <div className="flex items-center gap-3 px-2 py-2.5 max-[900px]:py-1.5 [&_strong]:block [&_strong]:max-w-[150px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-white [&_strong]:text-[13px] [&_small]:text-side-quiet [&_small]:text-xs max-[900px]:[&_small]:hidden">
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
      </aside>

      <main className="min-w-0 bg-warm-50">{children}</main>
    </div>
  );
}
