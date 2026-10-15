'use client'

import { useState, useTransition } from 'react'
import { salvarSimulador } from '@/app/painel/acoes-gestor'

interface Valores {
  taxaMin: string
  taxas: string
  ltvHe: string
  ltvFin: string
  prazos: string
  ufs: string
}

export function FormSimulador({ inicial }: { inicial: Valores }) {
  const [v, setV] = useState(inicial)
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const set = (k: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }))

  return (
    <form
      className="cartao doc-form"
      style={{ marginTop: 16, maxWidth: 720 }}
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          const r = await salvarSimulador(v)
          setAviso({ ok: r.ok, texto: r.mensagem })
        })
      }}
    >
      <h2>Simulador e regiões</h2>
      <div className="grade2">
        <div className="tf"><label htmlFor="c-tm">Taxa mínima, a partir de (% ao mês)</label><input id="c-tm" value={v.taxaMin} onChange={set('taxaMin')} inputMode="decimal" /><span className="msg">É a menor taxa real que algum banco parceiro pratica.</span></div>
        <div className="tf"><label htmlFor="c-tx">Opções de taxa mostradas (%)</label><input id="c-tx" value={v.taxas} onChange={set('taxas')} /><span className="msg">Separe por espaço. Ex.: 1,19 1,29 1,39</span></div>
        <div className="tf"><label htmlFor="c-he">Home equity: até quanto do imóvel (%)</label><input id="c-he" value={v.ltvHe} onChange={set('ltvHe')} inputMode="decimal" /></div>
        <div className="tf"><label htmlFor="c-fi">Financiamento: até quanto do imóvel (%)</label><input id="c-fi" value={v.ltvFin} onChange={set('ltvFin')} inputMode="decimal" /></div>
        <div className="tf"><label htmlFor="c-pr">Prazos mostrados (meses)</label><input id="c-pr" value={v.prazos} onChange={set('prazos')} /><span className="msg">Ex.: 120 180 240</span></div>
        <div className="tf"><label htmlFor="c-uf">Estados atendidos</label><input id="c-uf" value={v.ufs} onChange={set('ufs')} /><span className="msg">Siglas separadas por espaço.</span></div>
      </div>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      <button className="btn btn-brand" type="submit" disabled={pendente}>Salvar</button>
    </form>
  )
}
