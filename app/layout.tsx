import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Playfair_Display } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/lib/cart'
import { AudioProvider } from '@/lib/audio'
import CartAnnouncer from '@/components/commerce/CartAnnouncer'
import CustomCursor from '@/components/site/CustomCursor'
import SistersEgg from '@/components/site/SistersEgg'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OKHTEIN — Carryable Art',
  description:
    'The House of Two Sisters. Luxury handbags, fine jewelry, and accessories — cast in brass and cut by hand in Cairo. Carryable art, born of heritage and duality.',
  keywords: ['handbags', 'luxury', 'Cairo', 'Egypt', 'brass', 'leather', 'fine jewelry', 'Okhtein', 'أختين'],
  openGraph: {
    title: 'OKHTEIN — Carryable Art',
    description: 'The House of Two Sisters. Handcrafted in Cairo — brass and leather, refined into carryable art.',
    type: 'website',
    siteName: 'OKHTEIN',
    locale: 'en_EG',
  },
  robots: { index: true, follow: true },
  authors: [{ name: 'OKHTEIN' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-vault-black text-vault-cream">
        <a href="#new-arrivals" className="skip-link">Skip to shop</a>
        <CartProvider>
          <AudioProvider>{children}</AudioProvider>
          <CartAnnouncer />
        </CartProvider>
        <CustomCursor />
        <SistersEgg />
      </body>
    </html>
  )
}
