import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { Faq } from '@/components/Faq'

export const metadata: Metadata = {
  title: 'Perguntas frequentes sobre crédito com garantia de imóvel e financiamento',
  description: 'Tire dúvidas sobre home equity, taxa, limite em relação ao valor do imóvel, documentos e regiões atendidas pela Big Assessoria.',
  alternates: { canonical: '/perguntas-frequentes' },
}

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Faq titulo="Perguntas frequentes" />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
