// app/layout.js — minimal root layout, no styling (functionality only).
export const metadata = {
  title: "UAAMS : backend test harness",
  description: "Sprint 2 proof of concept backend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
