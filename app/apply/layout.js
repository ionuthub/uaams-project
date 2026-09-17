// app/apply/layout.js
// Per-route page title (WCAG 2.2 SC 2.4.2 Page Titled, issue #148).
// Pattern copied from app/login/layout.js: the page itself is "use client"
// and cannot export metadata, so this sibling server-component layout does.

export const metadata = {
  title: "Apply - UAAMS",
  description: "Complete and submit your university application: personal and academic details, course choice and supporting documents.",
};

export default function ApplyLayout({ children }) {
  return children;
}
