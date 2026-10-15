import Link from 'next/link'
import { MarcaBig } from './Icone'

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <span className="logo"><MarcaBig /><span className="w"><b>BIG</b><span>assessoria</span></span></span>
          <p style={{ marginTop: 14, maxWidth: '32em' }}>
            Consultoria e representação de bancos parceiros em crédito com garantia de imóvel, financiamento imobiliário e portabilidade. Desde 2015.
          </p>
        </div>
        <div>
          <h4>Produtos</h4>
          <ul>
            <li><Link href="/credito-com-garantia-de-imovel">Home equity</Link></li>
            <li><Link href="/financiamento-imobiliario">Financiamento imobiliário</Link></li>
            <li><Link href="/portabilidade-de-financiamento">Portabilidade</Link></li>
            <li><Link href="/#simulador">Simulador</Link></li>
          </ul>
        </div>
        <div>
          <h4>Atendimento</h4>
          <ul>
            <li>Ijuí/RS · Porto Alegre/RS · Joinville/SC</li>
            <li>MG, SP, MS, MT, PR, SC, RS, RJ e ES</li>
          </ul>
        </div>
        <p className="bottom">
          B.I.G. Soluções Imobiliárias LTDA · CNPJ 22.309.209/0001-74. A Big Assessoria atua como consultora e representante de bancos parceiros e não é instituição financeira. Taxas, prazos e valores são ilustrativos e dependem de análise de crédito e de avaliação do imóvel pela instituição. <Link href="/privacidade">Privacidade</Link> · <Link href="/termos">Termos</Link>
        </p>
      </div>
    </footer>
  )
}
