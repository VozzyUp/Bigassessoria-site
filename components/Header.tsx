import Link from 'next/link'
import { MarcaBig } from './Icone'

const LINKS = [
  { href: '/credito-com-garantia-de-imovel', rotulo: 'Home equity' },
  { href: '/financiamento-imobiliario', rotulo: 'Financiamento' },
  { href: '/portabilidade-de-financiamento', rotulo: 'Portabilidade' },
  { href: '/#como', rotulo: 'Como funciona' },
  { href: '/blog', rotulo: 'Blog' },
  { href: '/sobre', rotulo: 'Sobre' },
]

export function Header({ ativo }: { ativo?: string }) {
  return (
    <header className="header">
      <a className="skip" href="#conteudo">Pular para o conteúdo</a>
      <div className="wrap">
        <Link className="logo" href="/" aria-label="Big Assessoria, página inicial">
          <MarcaBig />
          <span className="w"><b>BIG</b><span>assessoria</span></span>
        </Link>
        <nav className="nav" aria-label="Principal">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={ativo === l.href ? 'page' : undefined}>{l.rotulo}</Link>
          ))}
        </nav>
        <Link className="btn btn-primary btn-sm" href="/#simulador">Simular agora</Link>
      </div>
    </header>
  )
}
