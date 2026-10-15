import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { IconeWhatsApp } from '@/components/Icone'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a Big Assessoria pelo WhatsApp ou faça uma simulação gratuita de crédito com garantia de imóvel, financiamento ou portabilidade.',
  alternates: { canonical: '/contato' },
}

export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <p className="eyebrow">Contato</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, margin: '8px 0 16px' }}>Fale com um especialista</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 17 }}>
            O atendimento é pelo WhatsApp, em horário comercial. Se preferir, comece pela simulação: ela leva menos de um minuto e já deixa o seu especialista com as informações em mãos.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '24px 0' }}>
            {/* redirect de servidor para o WhatsApp: Link tentaria pré-carregar e contaria cliques falsos */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="btn btn-whatsapp btn-lg" href="/w/site-contato"><IconeWhatsApp tamanho={20} />Chamar no WhatsApp</a>
            <Link className="btn btn-secondary btn-lg" href="/#simulador">Fazer uma simulação</Link>
          </div>
          <p className="meta">B.I.G. Soluções Imobiliárias LTDA · CNPJ 22.309.209/0001-74 · Ijuí/RS. Atendemos MG, SP, MS, MT, PR, SC, RS, RJ e ES.</p>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
