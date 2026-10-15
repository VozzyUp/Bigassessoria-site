import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <p className="eyebrow">Erro 404</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, margin: '8px 0 12px' }}>
            Esta página não existe
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 17 }}>
            O endereço pode ter mudado. Que tal simular a sua parcela agora? Leva menos de um minuto e é sem compromisso.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link className="btn btn-primary btn-lg" href="/#simulador">Fazer uma simulação</Link>
            <Link className="btn btn-secondary btn-lg" href="/blog">Ler o blog</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
