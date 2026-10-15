'use client'

import { useState, useTransition } from 'react'
import { liberarDocumentos, revogarCodigo, revisarDocumento } from '@/app/painel/acoes-lead'
import { alternarAgente, responderPeloPainel } from '@/app/painel/acoes-conversa'

export interface ItemDoc {
  id: string
  nome: string
  status: 'pendente' | 'enviado' | 'aprovado' | 'rejeitado'
  motivo: string | null
  arquivos: number
}

type Resp = { ok: boolean; mensagem: string }
const ROTULO: Record<ItemDoc['status'], string> = { pendente: 'Pendente', enviado: 'Para revisar', aprovado: 'Aprovado', rejeitado: 'Recusado' }
const campo = { height: 36, border: '1.5px solid var(--border-input)', borderRadius: 'var(--r-sm)', padding: '0 10px', minWidth: 0, flex: '1 1 180px' } as const

export function Documentos({ leadId, itens, codigoAtivo }: { leadId: string; itens: ItemDoc[]; codigoAtivo: boolean }) {
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [motivos, setMotivos] = useState<Record<string, string>>({})

  const rodar = (fn: () => Promise<Resp>) =>
    iniciar(async () => {
      const r = await fn()
      setAviso({ ok: r.ok, texto: r.mensagem })
    })

  return (
    <section className="cartao" aria-labelledby="docs-t" style={{ marginTop: 12 }}>
      <h2 id="docs-t">Documentos</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
        <button className="btn btn-brand btn-sm" disabled={pendente} onClick={() => rodar(() => liberarDocumentos(leadId))}>
          {itens.length ? 'Enviar novo código' : 'Liberar documentos'}
        </button>
        {codigoAtivo ? (
          <button className="btn btn-secondary btn-sm" disabled={pendente} onClick={() => rodar(() => revogarCodigo(leadId))}>Revogar código</button>
        ) : null}
        {codigoAtivo ? <span className="badge b-ok">Código ativo</span> : null}
      </div>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      {!itens.length ? (
        <p className="vazio">Nenhum documento liberado ainda. O código chega ao cliente pelo WhatsApp.</p>
      ) : (
        <ul className="doc-itens" style={{ marginTop: 10 }}>
          {itens.map((i) => (
            <li key={i.id} className="doc-item">
              <header>
                <b>{i.nome}</b>
                <span className={'badge ' + (i.status === 'aprovado' ? 'b-ok' : i.status === 'rejeitado' ? 'b-hot' : i.status === 'enviado' ? 'b-brand' : '')}>{ROTULO[i.status]}</span>
              </header>
              {i.motivo ? <p className="meta">Motivo da recusa: {i.motivo}</p> : null}
              {i.arquivos > 0 ? (
                <p style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {Array.from({ length: i.arquivos }, (_, n) => (
                    <a key={n} href={'/painel/documentos/' + i.id + '/' + n} target="_blank" rel="noreferrer">Abrir arquivo {n + 1}</a>
                  ))}
                </p>
              ) : null}
              {i.status === 'enviado' ? (
                <div className="acoes">
                  <button className="btn btn-brand btn-sm" disabled={pendente} onClick={() => rodar(() => revisarDocumento(leadId, i.id, true, ''))}>Aprovar</button>
                  <input
                    aria-label={'Motivo para recusar ' + i.nome}
                    placeholder="Motivo, se for recusar"
                    value={motivos[i.id] ?? ''}
                    onChange={(e) => setMotivos((m) => ({ ...m, [i.id]: e.target.value }))}
                    style={campo}
                  />
                  <button className="btn btn-secondary btn-sm" disabled={pendente} onClick={() => rodar(() => revisarDocumento(leadId, i.id, false, motivos[i.id] ?? ''))}>Recusar</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Responder({ conversaId, agenteAtivo }: { conversaId: string; agenteAtivo: boolean }) {
  const [texto, setTexto] = useState('')
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  return (
    <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
      <label htmlFor={'r-' + conversaId} className="meta">Responder pelo painel (sai pelo WhatsApp do vendedor)</label>
      <textarea
        id={'r-' + conversaId}
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        style={{ border: '1.5px solid var(--border-input)', borderRadius: 'var(--r-md)', padding: 10, font: '400 15px var(--sans)', width: '100%' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn btn-brand btn-sm"
          disabled={pendente || !texto.trim()}
          onClick={() =>
            iniciar(async () => {
              const r = await responderPeloPainel(conversaId, texto)
              setAviso({ ok: r.ok, texto: r.mensagem })
              if (r.ok) setTexto('')
            })
          }
        >
          Enviar
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={pendente}
          role="switch"
          aria-checked={agenteAtivo}
          onClick={() =>
            iniciar(async () => {
              const r = await alternarAgente(conversaId, !agenteAtivo)
              setAviso({ ok: r.ok, texto: r.mensagem })
            })
          }
        >
          {agenteAtivo ? 'Desligar agente de IA nesta conversa' : 'Ligar agente de IA nesta conversa'}
        </button>
        {aviso ? <span role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'} style={{ padding: '4px 10px' }}>{aviso.texto}</span> : null}
      </div>
    </div>
  )
}
