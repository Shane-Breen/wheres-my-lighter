import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Where’s My Lighter?",
  description: "Track a lighter’s journey. One tap at a time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
