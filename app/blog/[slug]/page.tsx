import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import { JsonLd } from '@/components/JsonLd'
import { ARTIGOS, artigoPorSlug } from '@/lib/blog'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = artigoPorSlug((await params).slug)
  if (!a) return {}
  return { title: a.titulo, description: a.descricao, alternates: { canonical: '/blog/' + a.slug }, openGraph: { type: 'article', title: a.titulo, description: a.descricao, publishedTime: a.publicadoEm } }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const a = artigoPorSlug((await params).slug)
  if (!a) notFound()

  // agrupa as linhas de lista ("- ") em um único <ul>
  const blocos: { tipo: 'p' | 'h2' | 'ul'; itens: string[] }[] = []
  for (const linha of a.corpo) {
    if (linha.startsWith('## ')) blocos.push({ tipo: 'h2', itens: [linha.slice(3)] })
    else if (linha.startsWith('- ')) {
      const ultimo = blocos[blocos.length - 1]
      if (ultimo?.tipo === 'ul') ultimo.itens.push(linha.slice(2))
      else blocos.push({ tipo: 'ul', itens: [linha.slice(2)] })
    } else blocos.push({ tipo: 'p', itens: [linha] })
  }

  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <article className="wrap" style={{ maxWidth: 720 }}>
          <p><Link href="/blog" style={{ color: 'var(--brand)' }}>← Blog</Link></p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,38px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, margin: '12px 0' }}>{a.titulo}</h1>
          <p className="meta">Publicado em {a.publicadoEm.split('-').reverse().join('/')} · {a.minutos} min de leitura</p>
          <div className="texto-artigo">
            {blocos.map((b, i) =>
              b.tipo === 'h2' ? <h2 key={i}>{b.itens[0]}</h2> : b.tipo === 'ul' ? <ul key={i}>{b.itens.map((x) => <li key={x}>{x}</li>)}</ul> : <p key={i}>{b.itens[0]}</p>,
            )}
          </div>
          <div className="cartao" style={{ marginTop: 32 }}>
            <h2>Simule a sua parcela</h2>
            <p className="meta" style={{ margin: '6px 0 12px' }}>Gratuito, sem compromisso. Um especialista compara as propostas dos bancos parceiros.</p>
            <Link className="btn btn-primary" href="/#simulador">Simular agora</Link>
          </div>
          <p className="meta" style={{ marginTop: 20 }}>Conteúdo informativo, não é recomendação de crédito. Condições, taxas e aprovação dependem da análise da instituição financeira.</p>
        </article>
      </main>
      <Footer />
      <WhatsAppFab />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Article', headline: a.titulo, description: a.descricao, datePublished: a.publicadoEm, inLanguage: 'pt-BR', mainEntityOfPage: SITE + '/blog/' + a.slug, publisher: { '@id': SITE + '/#org' }, author: { '@id': SITE + '/#org' } },
            { '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog' },
              { '@type': 'ListItem', position: 3, name: a.titulo, item: SITE + '/blog/' + a.slug },
            ] },
          ],
        }}
      />
    </>
  )
}
