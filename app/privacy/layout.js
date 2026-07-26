export const metadata = { title: "Privacy notice | UAAMS" };

// Keeps the page title on the privacy route now that the page itself is a
// client component (client components cannot export metadata).
export default function PrivacyLayout({ children }) {
  return children;
}
