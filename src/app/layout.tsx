import type { Metadata, Viewport } from 'next'
import { Fredoka } from 'next/font/google'
import './globals.css'

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Poké Math',
  description:
    'Reken je Pokémon naar de overwinning! Optellen, aftrekken, vermenigvuldigen en delen.',
  appleWebApp: { capable: true, title: 'Poké Math', statusBarStyle: 'default' }
}

export const viewport: Viewport = {
  themeColor: '#ffcb05',
  width: 'device-width',
  initialScale: 1,
  // Kids double-tap a lot: keep the page from zooming, and use the full screen on iPad.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
