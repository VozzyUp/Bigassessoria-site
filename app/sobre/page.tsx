import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = { title: 'Sobre a Big Assessoria', robots: { index: false } }

export default function Page() {
  return (
    <>
      <Header ativo="/sobre" />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand-strong)' }}>Sobre a Big Assessoria</h1>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
            Página em construção. A Big Assessoria (B.I.G. Soluções Imobiliárias LTDA, CNPJ 22.309.209/0001-74) atua desde 2015 como consultora e representante de bancos parceiros em crédito imobiliário.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
