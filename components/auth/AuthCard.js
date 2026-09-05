// components/auth/AuthCard.js
// Shared responsive shell for the auth-style screens (also reused by the
// portal error and empty states). Includes a minimal site header so these
// standalone routes are not blank pages with no navigation.
// Styling: Tailwind utilities, mobile-first (centres vertically from 480px up).

export default function AuthCard({ title, subtitle, children }) {
  return (
    <>
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between bg-white/95 border-b border-border backdrop-blur-md px-[max(24px,calc((100vw-1200px)/2))]">
        <a href="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="UAAMS home">
          <span className="w-9 h-9 shrink-0 inline-grid place-items-center rounded-[50%_50%_46%_46%] text-white bg-navy-900 font-editorial text-[19px]" aria-hidden="true">U</span>
          <span className="text-navy-900 font-bold text-[17px] tracking-[0.08em]">UAAMS</span>
        </a>
        <a href="/" className="text-[13px] font-semibold text-muted no-underline px-3 py-2 rounded-[7px] transition-colors hover:bg-slate-50 hover:text-navy-900 focus-visible:outline-[3px] focus-visible:outline-blue-100 focus-visible:outline-offset-2">
          ← Back to home
        </a>
      </header>
      <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-64px)] flex justify-center items-start bg-warm-50 px-4 py-10 min-[480px]:items-center">
        <div className="w-full max-w-[420px] bg-white border border-border rounded-[10px] p-6 shadow-sm">
          <h1 className="m-0 text-xl font-semibold text-navy-900">{title}</h1>
          {subtitle && <p className="mt-1 mb-0 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6 flex flex-col gap-[1.1rem]">{children}</div>
        </div>
      </main>
    </>
  );
}
