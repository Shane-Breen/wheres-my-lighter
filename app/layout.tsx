import type { Metadata } from "next";
import "./globals.css";
import { Cinzel, VT323 } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const vt323 = VT323({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Where’s My Lighter",
  description: "Tap to add a sighting.",
  icons: {
    icon: "/logo_app.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}
