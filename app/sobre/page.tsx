import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WhatsAppFab } from '@/components/WhatsAppFab'

export const metadata: Metadata = {
  title: 'Sobre a Big Assessoria',
  description: 'Desde 2015, a Big Assessoria atua como consultora e representante de bancos parceiros em crédito com garantia de imóvel, financiamento e portabilidade.',
  alternates: { canonical: '/sobre' },
}

export default function Page() {
  return (
    <>
      <Header ativo="/sobre" />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <p className="eyebrow">Quem somos</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, margin: '8px 0 16px' }}>
            Crédito imobiliário com acompanhamento de verdade
          </h1>
          <div className="texto-artigo">
            <p>
              A Big Assessoria atua desde 2015 ajudando pessoas e empresas a conseguir crédito com garantia de imóvel, financiamento imobiliário e portabilidade. Somos consultora e representante de bancos parceiros: levamos o seu caso a mais de uma instituição, comparamos as condições e acompanhamos o processo até a liberação.
            </p>
            <h2>Como trabalhamos</h2>
            <ul>
              <li>Você simula no site, sem compromisso.</li>
              <li>Um especialista fala com você pelo WhatsApp e confirma os dados.</li>
              <li>Levamos o seu perfil aos bancos parceiros e trazemos as propostas.</li>
              <li>Você envia os documentos por um canal seguro, com um código recebido no WhatsApp.</li>
              <li>Acompanhamos a avaliação do imóvel, o contrato e o registro.</li>
            </ul>
            <h2>O que não fazemos</h2>
            <p>
              A Big não é banco nem financeira e não concede crédito. A aprovação, a taxa e o prazo finais são definidos pela instituição financeira, depois da análise do seu perfil e do imóvel. Nunca prometemos aprovação.
            </p>
            <h2>Dados da empresa</h2>
            <p>
              B.I.G. Soluções Imobiliárias LTDA, CNPJ 22.309.209/0001-74. Atendimento em Minas Gerais, São Paulo, Mato Grosso do Sul, Mato Grosso, Paraná, Santa Catarina, Rio Grande do Sul, Rio de Janeiro e Espírito Santo.
            </p>
          </div>
          <p style={{ marginTop: 24 }}><Link className="btn btn-primary" href="/#simulador">Fazer uma simulação</Link></p>
        </div>
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
