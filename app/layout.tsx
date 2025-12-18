import "./globals.css";

export const metadata = {
  title: "Where’s My Lighter?",
  description: "Track a lighter’s journey",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
