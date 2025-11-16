import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'GiddyApp - The Premier Horse Marketplace',
  description: 'Buy and sell horses with confidence. Verified sellers, secure transactions, and comprehensive listings.',
  keywords: 'horses for sale, buy horses, sell horses, equestrian marketplace, horse trading',
  openGraph: {
    title: 'GiddyApp - The Premier Horse Marketplace',
    description: 'The trusted marketplace for buying and selling horses',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          <Header />
          <main className="pt-16">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}