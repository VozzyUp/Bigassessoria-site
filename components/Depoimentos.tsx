import { depoimentosPublicados } from '@/lib/depoimentos'

/** Prova social real: não renderiza nada enquanto não houver depoimento publicado e autorizado. */
export async function Depoimentos() {
  const itens = await depoimentosPublicados()
  if (!itens.length) return null
  return (
    <section className="band" aria-labelledby="dep-t">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow">Quem já usou</p>
          <h2 id="dep-t">O que dizem os nossos clientes</h2>
        </div>
        <div className="intents">
          {itens.map((d) => (
            <figure key={d.id} className="intent" style={{ margin: 0 }}>
              {d.nota ? <p aria-label={'Nota ' + d.nota + ' de 5'} style={{ color: 'var(--accent-hover)', letterSpacing: 2 }}>{'★'.repeat(d.nota)}{'☆'.repeat(5 - d.nota)}</p> : null}
              <blockquote style={{ margin: 0, fontSize: 16, lineHeight: '26px' }}>{d.texto}</blockquote>
              <figcaption className="meta" style={{ marginTop: 'auto' }}>
                {d.nome}{d.cidade ? ' · ' + d.cidade + (d.uf ? '/' + d.uf : '') : ''}{d.fonte === 'google' ? ' · avaliação no Google' : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
