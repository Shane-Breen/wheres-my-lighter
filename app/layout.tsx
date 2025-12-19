// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pressstart",
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Where’s My Lighter",
  description: "Tap to add a sighting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}
