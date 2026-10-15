import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Obrigado } from './Obrigado'

export const metadata: Metadata = { title: 'Recebemos a sua simulação', robots: { index: false } }

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <Obrigado />
        </div>
      </main>
      <Footer />
    </>
  )
}
