import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = { title: 'Política de privacidade', robots: { index: false } }

// RASCUNHO operacional, a ser revisado por advogado antes de ir ao ar com tráfego pago.
export default function Page() {
  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 720, display: 'grid', gap: 14 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand-strong)' }}>Política de privacidade</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            B.I.G. Soluções Imobiliárias LTDA (Big Assessoria), CNPJ 22.309.209/0001-74, é a controladora dos dados tratados neste site, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
          <h2 style={{ fontSize: 20, marginTop: 10 }}>Que dados coletamos</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Nome, WhatsApp, e-mail (opcional), estado do imóvel e os valores da simulação que você informa. Depois, se você seguir com o atendimento, os dados cadastrais e os documentos que enviar. Também registramos de qual anúncio ou página você veio (por exemplo parâmetros UTM e identificadores de campanha).
          </p>
          <h2 style={{ fontSize: 20, marginTop: 10 }}>Para que usamos</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Para falar com você sobre a simulação, analisar o seu perfil junto aos bancos parceiros e conduzir o pedido de crédito. Com o seu consentimento específico, também para enviar novidades e para medir a eficácia dos nossos anúncios.
          </p>
          <h2 style={{ fontSize: 20, marginTop: 10 }}>Com quem compartilhamos</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Com os bancos e instituições parceiras apenas na medida necessária para a sua análise de crédito, e com fornecedores de tecnologia que operam o site e o atendimento, sob contrato de confidencialidade.
          </p>
          <h2 style={{ fontSize: 20, marginTop: 10 }}>Seus direitos</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Você pode pedir acesso, correção, anonimização ou exclusão dos seus dados e revogar o consentimento a qualquer momento, falando com a gente pelo WhatsApp do atendimento. Guardamos os dados pelo tempo necessário ao atendimento e às obrigações legais.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
