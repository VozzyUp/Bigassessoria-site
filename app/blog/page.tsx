import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { ARTIGOS } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog: crédito com garantia de imóvel, financiamento e portabilidade',
  description: 'Guias práticos para entender home equity, financiamento imobiliário, portabilidade e a documentação necessária.',
  alternates: { canonical: '/blog' },
}

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Blog</p>
            <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, marginTop: 8 }}>
              Guias para decidir com segurança
            </h1>
            <p>Conteúdo informativo sobre crédito com garantia de imóvel, financiamento e portabilidade.</p>
          </div>
          <div className="intents">
            {ARTIGOS.map((a) => (
              <Link key={a.slug} className="intent" href={'/blog/' + a.slug}>
                <h2 style={{ fontSize: 20, lineHeight: '26px', color: 'var(--brand-strong)' }}>{a.titulo}</h2>
                <p>{a.descricao}</p>
                <span className="go">{a.minutos} min de leitura</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
