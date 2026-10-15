'use client'

import { useState, useTransition } from 'react'
import { alternarAgenteNumero, salvarAgente } from '@/app/painel/acoes-gestor'

interface Valores {
  ativoGlobal: boolean
  maxMsgs: string
  atrasoMin: string
  atrasoMax: string
  base: string
}

export function FormAgente({ inicial }: { inicial: Valores }) {
  const [v, setV] = useState(inicial)
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  return (
    <form
      className="cartao doc-form"
      style={{ marginTop: 16, maxWidth: 820 }}
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          const r = await salvarAgente(v)
          setAviso({ ok: r.ok, texto: r.mensagem })
        })
      }}
    >
      <label className="check" style={{ color: 'var(--text)', fontSize: 16 }}>
        <input type="checkbox" role="switch" checked={v.ativoGlobal} onChange={(e) => setV({ ...v, ativoGlobal: e.target.checked })} />
        <span><b>Agente de IA ligado</b>. Desligado, nenhuma conversa é respondida pela IA em lugar nenhum.</span>
      </label>
      <div className="grade2">
        <div className="tf"><label htmlFor="a-max">Mensagens da IA antes de chamar um humano</label><input id="a-max" value={v.maxMsgs} onChange={(e) => setV({ ...v, maxMsgs: e.target.value })} inputMode="numeric" /></div>
        <div className="tf"><label htmlFor="a-d1">Espera antes de responder (segundos): mínimo e máximo</label>
          <div style={{ display: 'flex', gap: 8 }}><input aria-label="mínimo" value={v.atrasoMin} onChange={(e) => setV({ ...v, atrasoMin: e.target.value })} id="a-d1" inputMode="numeric" /><input aria-label="máximo" value={v.atrasoMax} onChange={(e) => setV({ ...v, atrasoMax: e.target.value })} inputMode="numeric" /></div></div>
      </div>
      <div className="tf">
        <label htmlFor="a-base">Base de conhecimento (o que o agente pode afirmar)</label>
        <textarea id="a-base" rows={12} value={v.base} onChange={(e) => setV({ ...v, base: e.target.value })} style={{ height: 'auto', padding: 12, lineHeight: 1.5 }} />
        <span className="msg">Taxa, regiões, prazos, documentos e como a Big atua. Se algo não está aqui, o agente não afirma: ele chama um humano.</span>
      </div>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      <button className="btn btn-brand" type="submit" disabled={pendente}>Salvar</button>
    </form>
  )
}

export function ToggleNumero({ id, ativo }: { id: string; ativo: boolean }) {
  const [pendente, iniciar] = useTransition()
  const [estado, setEstado] = useState(ativo)
  return (
    <button
      className="btn btn-secondary btn-sm"
      role="switch"
      aria-checked={estado}
      disabled={pendente}
      onClick={() => iniciar(async () => {
        const r = await alternarAgenteNumero(id, !estado)
        if (r.ok) setEstado(!estado)
      })}
    >
      {estado ? 'Agente ligado neste número' : 'Agente desligado neste número'}
    </button>
  )
}
