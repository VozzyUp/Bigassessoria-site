import { Header } from './Header'
import { Footer } from './Footer'
import { WhatsAppFab } from './WhatsAppFab'
import { Simulador } from './Simulador'
import { TrustBar, Caminhos, ComoFunciona } from './SecoesHome'
import { Icone } from './Icone'
import { Faq } from './Faq'

export interface DadosProduto {
  rota: string
  eyebrow: string
  titulo: React.ReactNode
  lead: string
  beneficios: string[]
  produto: 'home_equity' | 'financiamento'
}

export function ProdutoPage({ d }: { d: DadosProduto }) {
  return (
    <>
      <Header ativo={d.rota} />
      <main id="conteudo">
        <section className="hero" aria-labelledby="h1">
          <div className="wrap">
            <div>
              <p className="eyebrow" style={{ color: 'var(--on-brand-muted)' }}>{d.eyebrow}</p>
              <h1 id="h1" style={{ marginTop: 12 }}>{d.titulo}</h1>
              <p className="lead">{d.lead}</p>
              <ul>
                {d.beneficios.map((b) => (
                  <li key={b}><Icone nome="check" tamanho={18} />{b}</li>
                ))}
              </ul>
              <div className="ctas">
                <a className="btn btn-primary btn-lg" href="#simulador">Simular minha parcela <Icone nome="arrow" tamanho={18} /></a>
                <a className="btn btn-secondary btn-lg" href="#como">Como funciona</a>
              </div>
            </div>
            <Simulador produtoInicial={d.produto} />
          </div>
        </section>
        <TrustBar />
        <Caminhos />
        <ComoFunciona />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
