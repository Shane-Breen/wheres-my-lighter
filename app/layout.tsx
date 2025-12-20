import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Where’s My Lighter",
  description: "Tap to add a sighting",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
