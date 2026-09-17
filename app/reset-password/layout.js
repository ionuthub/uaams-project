// app/reset-password/layout.js
// Per-route page title (WCAG 2.2 SC 2.4.2 Page Titled, issue #148).

export const metadata = {
  title: "Reset your password - UAAMS",
  description: "Request a password reset link or set a new password for your UAAMS account.",
};

export default function ResetPasswordLayout({ children }) {
  return children;
}
