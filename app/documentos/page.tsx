import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { sessaoDoCliente } from '@/lib/documentos/sessao-http'
import { CodigoForm } from './CodigoForm'

export const metadata: Metadata = { title: 'Enviar documentos', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Page() {
  if (await sessaoDoCliente()) redirect('/documentos/enviar')
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 520 }}>
          <p className="eyebrow">Envio seguro</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,36px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, marginTop: 8 }}>
            Enviar documentos
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
            Digite o seu WhatsApp e o código de 6 dígitos que enviamos nessa conversa. O código vale por 24 horas e é só seu.
          </p>
          <CodigoForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
