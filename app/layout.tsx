export const metadata = {
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
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
