import "./globals.css";

export const metadata = {
  title: "Where's My Lighter?",
  description: "Tracking this tiny flame across the globe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070716] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
