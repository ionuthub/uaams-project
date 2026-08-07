// app/login/layout.js
// Per-route page title (WCAG 2.2 SC 2.4.2 Page Titled, issue #148).
//
// Every route currently inherits the single title set in app/layout.js, so a
// screen reader user tabbing between browser tabs hears the same string for
// sign-in, registration and their dashboard. Titles are supposed to describe
// the page, not the site.
//
// The pages themselves are "use client" and a client component cannot export
// metadata. A sibling layout is a server component, so it can - this file is
// the pattern to copy for the other routes.

export const metadata = {
  title: "Sign in - UAAMS",
  description: "Sign in to your UAAMS applicant account to track your applications.",
};

export default function LoginLayout({ children }) {
  return children;
}
