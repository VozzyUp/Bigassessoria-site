import Link from 'next/link'
import { Icone } from './Icone'

export function TrustBar() {
  return (
    <section className="trust" aria-label="Por que a Big">
      <div className="wrap">
        <div><Icone nome="cal" tamanho={26} /><p><b>Desde 2015</b><br /><span>assessorando crédito imobiliário</span></p></div>
        <div><Icone nome="map" tamanho={26} /><p><b>9 estados</b><br /><span>Sul, Sudeste e Centro-Oeste</span></p></div>
        <div><Icone nome="bank" tamanho={26} /><p><b>Vários bancos</b><br /><span>uma análise, várias propostas</span></p></div>
        <div><Icone nome="shield" tamanho={26} /><p><b>Dados protegidos</b><br /><span>documentos por canal seguro</span></p></div>
      </div>
    </section>
  )
}

export function Caminhos() {
  return (
    <section className="band" id="produtos" aria-labelledby="p-t">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow">O que você precisa</p>
          <h2 id="p-t">Três caminhos, o mesmo cuidado</h2>
          <p>Escolha o seu objetivo e simule. Um especialista da Big continua a conversa com você pelo WhatsApp.</p>
        </div>
        <div className="intents">
          <Link className="intent" href="/credito-com-garantia-de-imovel">
            <span className="ic"><Icone nome="key" tamanho={22} /></span>
            <h3>Crédito com garantia de imóvel</h3>
            <p>Dinheiro para o seu negócio, quitar dívidas caras ou reformar, com taxa de crédito imobiliário.</p>
            <span className="go">Conhecer o home equity <Icone nome="arrow" tamanho={16} /></span>
          </Link>
          <Link className="intent" href="/financiamento-imobiliario">
            <span className="ic"><Icone nome="home" tamanho={22} /></span>
            <h3>Comprar um imóvel</h3>
            <p>Financiamento de até 80% do valor, com a comparação dos bancos feita por quem entende do processo.</p>
            <span className="go">Conhecer o financiamento <Icone nome="arrow" tamanho={16} /></span>
          </Link>
          <Link className="intent" href="/portabilidade-de-financiamento">
            <span className="ic"><Icone nome="down" tamanho={22} /></span>
            <h3>Baixar a parcela</h3>
            <p>Já tem financiamento? Leve o saldo para um banco com condição melhor e pague menos todo mês.</p>
            <span className="go">Conhecer a portabilidade <Icone nome="arrow" tamanho={16} /></span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export function ComoFunciona() {
  return (
    <section className="band" id="como" style={{ background: 'var(--surface)' }} aria-labelledby="c-t">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow">Como funciona</p>
          <h2 id="c-t">Da simulação ao dinheiro na conta</h2>
        </div>
        <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li className="step"><h3>Simulação</h3><p>Você simula aqui e fala com um especialista no WhatsApp.</p></li>
          <li className="step"><h3>Análise com os bancos</h3><p>Levamos o seu perfil aos bancos parceiros e trazemos as propostas.</p></li>
          <li className="step"><h3>Documentos e avaliação</h3><p>Você envia os documentos pelo nosso canal seguro e o imóvel é avaliado.</p></li>
          <li className="step"><h3>Liberação</h3><p>Contrato assinado e registrado, o crédito cai na sua conta.</p></li>
        </ol>
      </div>
    </section>
  )
}
