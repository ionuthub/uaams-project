// app/layout.js
// Root layout. Adds the shared design tokens (globals.css) and the two
// fonts used across the approved prototype (Inter for UI, Source Serif 4
// for editorial headings). Dawid's test harness (app/page.js) still
// renders fine inside this layout - nothing here removes functionality.
import "./globals.css";

export const metadata = {
  title: "UAAMS",
  description: "University Administration and Application Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
