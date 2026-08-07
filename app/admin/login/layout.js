// app/admin/login/layout.js
// Per-route page title (WCAG 2.2 SC 2.4.2 Page Titled, issue #148).

export const metadata = {
  title: "Staff sign in - UAAMS",
  description: "Sign in to the UAAMS admissions portal with your institutional staff account.",
};

export default function AdminLoginLayout({ children }) {
  return children;
}
