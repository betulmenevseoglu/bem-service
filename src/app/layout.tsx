import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Bem Otomasyon Saha Servis',
  description: 'Bem Otomasyon saha servis yönetim uygulaması',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Bem Servis' },
}

export const viewport: Viewport = {
  themeColor: '#1FBFB8',
  width: 'device-width',
  initialScale: 1,
  // iPhone çentik/durum çubuğu ve home göstergesi için safe-area değerlerini açar (env(safe-area-inset-*))
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
