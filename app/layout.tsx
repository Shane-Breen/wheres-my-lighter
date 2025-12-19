import "./globals.css";

export const metadata = {
  title: "Where’s My Lighter",
  description: "Tap to add a sighting",
  icons: {
    icon: "/logo-app.png",
    apple: "/logo-app.png",
  },
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
