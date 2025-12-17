import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Where’s My Lighter?",
  description: "Track a lighter’s journey. One tap at a time.",
  openGraph: {
    title: "Where’s My Lighter?",
    description: "Track a lighter’s journey. One tap at a time.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Where’s My Lighter?",
    description: "Track a lighter’s journey. One tap at a time.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
          backgroundColor: "#0b0b10",
          color: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
