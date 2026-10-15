import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], style: ['normal', 'italic'], variable: '--font-jakarta', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Big Assessoria | Crédito com garantia de imóvel e financiamento', template: '%s | Big Assessoria' },
  description:
    'Simule crédito com garantia de imóvel, financiamento imobiliário e portabilidade. Taxas a partir de 1,19% ao mês, análise com vários bancos parceiros e atendimento por WhatsApp.',
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Big Assessoria' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#37495d' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  )
}
