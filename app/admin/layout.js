// app/admin/layout.js
// Per-route page title (WCAG 2.2 SC 2.4.2 Page Titled, issue #148).
// Distinct from app/admin/login/layout.js, which already titles the sign-in
// page only - this covers the admissions dashboard itself.

export const metadata = {
  title: "Admissions overview - UAAMS",
  description: "Review applications for your university, filter and search the queue, and record decisions.",
};

export default function AdminLayout({ children }) {
  return children;
}
