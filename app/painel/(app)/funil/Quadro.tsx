'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ETAPAS, MOTIVOS_PERDA, temperaturaDe } from '@/lib/funil'
import { formatarBRL } from '@/lib/financeiro'
import { moverEtapaDireto } from '@/app/painel/acoes-lead'

export interface Card {
  id: string
  titulo: string
  etapa: string
  temperatura: number | null
  valorCentavos: number | null
  resumo: string | null
  diasNaEtapa: number
  foraRegiao: boolean
}

/** Quadro do funil. Arrastar e soltar com o mouse; o seletor em cada card faz o mesmo pelo teclado e pelo celular. */
export function Quadro({ inicial }: { inicial: Card[] }) {
  const [cards, setCards] = useState(inicial)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)
  const [perda, setPerda] = useState<{ id: string; motivo: string } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  function mover(id: string, etapa: string, motivo = '') {
    const anterior = cards
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, etapa, diasNaEtapa: 0 } : c)))
    setAviso(null)
    iniciar(async () => {
      const r = await moverEtapaDireto(id, etapa, motivo)
      if (!r.ok) {
        setCards(anterior)
        setAviso(r.mensagem)
      }
    })
  }

  function soltar(etapa: string) {
    const id = arrastando
    setArrastando(null)
    setSobre(null)
    if (!id) return
    const card = cards.find((c) => c.id === id)
    if (!card || card.etapa === etapa) return
    if (etapa === 'perdido') setPerda({ id, motivo: '' })
    else mover(id, etapa)
  }

  return (
    <>
      {aviso ? <p role="alert" className="aviso-erro">{aviso}</p> : null}
      {perda ? (
        <div role="dialog" aria-label="Motivo da perda" className="cartao" style={{ maxWidth: 420, margin: '8px 0' }}>
          <p><b>Por que este contato foi perdido?</b></p>
          <select aria-label="Motivo da perda" value={perda.motivo} onChange={(e) => setPerda({ ...perda, motivo: e.target.value })} style={{ height: 40, width: '100%', margin: '8px 0' }}>
            <option value="">Selecione</option>
            {MOTIVOS_PERDA.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-brand btn-sm" disabled={!perda.motivo} onClick={() => { mover(perda.id, 'perdido', perda.motivo); setPerda(null) }}>Confirmar</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setPerda(null)}>Cancelar</button>
          </div>
        </div>
      ) : null}
      <div className="kanban" aria-busy={pendente}>
        {ETAPAS.map((etapa) => {
          const lista = cards.filter((c) => c.etapa === etapa.id)
          return (
            <section
              key={etapa.id}
              className="kcol"
              aria-label={etapa.nome}
              onDragOver={(e) => { e.preventDefault(); setSobre(etapa.id) }}
              onDragLeave={() => setSobre((s) => (s === etapa.id ? null : s))}
              onDrop={(e) => { e.preventDefault(); soltar(etapa.id) }}
              style={sobre === etapa.id ? { outline: '2px dashed var(--brand)' } : undefined}
            >
              <h2>{etapa.nome} <span>{lista.length}</span></h2>
              {lista.length === 0 ? <p className="vazio">Solte um contato aqui</p> : null}
              {lista.map((c) => {
                const temp = temperaturaDe(c.temperatura)
                return (
                  <article key={c.id} className="kcard" draggable onDragStart={() => setArrastando(c.id)} onDragEnd={() => { setArrastando(null); setSobre(null) }} style={{ cursor: 'grab', opacity: arrastando === c.id ? 0.5 : 1 }}>
                    <div className="t">
                      <Link href={'/painel/leads/' + c.id}><b>{c.titulo}</b></Link>
                      {temp ? <span className={'badge ' + (temp === 'quente' ? 'b-hot' : temp === 'morno' ? 'b-warm' : '')}>{temp} {c.temperatura}</span> : null}
                    </div>
                    {c.valorCentavos ? <div className="val num">{formatarBRL(c.valorCentavos)}</div> : null}
                    {c.resumo ? <p>{c.resumo}</p> : null}
                    <p className="meta">{c.diasNaEtapa > 0 ? c.diasNaEtapa + ' d nesta etapa' : 'hoje'}{c.foraRegiao ? ' · fora da região' : ''}</p>
                    <label className="sr-only" htmlFor={'m-' + c.id}>Mover {c.titulo} para</label>
                    <select id={'m-' + c.id} value={c.etapa} onChange={(e) => (e.target.value === 'perdido' ? setPerda({ id: c.id, motivo: '' }) : mover(c.id, e.target.value))} style={{ height: 36, border: '1.5px solid var(--border-input)', borderRadius: 'var(--r-sm)', padding: '0 8px', background: 'var(--bg)', minWidth: 0 }}>
                      {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                  </article>
                )
              })}
            </section>
          )
        })}
      </div>
    </>
  )
}
