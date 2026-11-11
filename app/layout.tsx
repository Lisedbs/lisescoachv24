import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Lise's Coach ✨",
  description: 'Ton programme de course, pensé pour toi.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: "Lise's Coach" }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
