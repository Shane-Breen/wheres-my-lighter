import "./globals.css";
import { Press_Start_2P } from "next/font/google";

const pixel = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--pixel-font",
});

export const metadata = {
  title: "Where’s My Lighter",
  description: "Tap to add a sighting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${pixel.variable} crt`}>
        {children}
      </body>
    </html>
  );
}
