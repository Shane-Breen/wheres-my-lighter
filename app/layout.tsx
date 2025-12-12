export const metadata = {
  title: "Where’s My Lighter",
  description: "Track the journey of a lighter via NFC taps",
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
