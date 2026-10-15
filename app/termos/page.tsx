import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = { title: 'Termos de uso', robots: { index: false } }

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand-strong)' }}>Termos de uso</h1>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
            Texto em elaboração e revisão jurídica. As simulações do site são ilustrativas, não constituem oferta de crédito e dependem de análise e aprovação da instituição financeira.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
