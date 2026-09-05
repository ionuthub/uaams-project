// app/student/layout.js
// Per-route page title (WCAG 2.2 SC 2.4.2 Page Titled, issue #148).

export const metadata = {
  title: "Your applications - UAAMS",
  description: "Track the status of your university applications and respond to decisions.",
};

export default function StudentLayout({ children }) {
  return children;
}
