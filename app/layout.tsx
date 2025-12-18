import './globals.css'

export const metadata = {
  title: "Where's My Lighter",
  description: 'Lighter journeys, quietly remembered.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
