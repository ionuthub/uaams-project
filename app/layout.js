// Shared metadata and document structure for every UAAMS route.
export const metadata = {
  title: "UAAMS | University Applications",
  description:
    "University Administration and Application Management System proof of concept.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
