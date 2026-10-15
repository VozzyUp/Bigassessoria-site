'use client'

import { useState, useTransition } from 'react'
import { lancarGasto } from '@/app/painel/acoes-gestor'

export function GastoForm() {
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <section className="cartao" aria-labelledby="g-t" style={{ marginTop: 12 }}>
      <h2 id="g-t">Lançar gasto de anúncios</h2>
      <p className="meta">Digite o valor gasto em um dia. Lançar de novo no mesmo dia e campanha substitui o valor.</p>
      <form
        className="grade-gasto"
        onSubmit={(e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          iniciar(async () => {
            const r = await lancarGasto(String(f.get('plataforma')), String(f.get('campanha')), String(f.get('dia')), String(f.get('valor')))
            setAviso({ ok: r.ok, texto: r.mensagem })
          })
        }}
      >
        <div className="tf"><label htmlFor="g-p">Plataforma</label>
          <select id="g-p" name="plataforma" defaultValue="google_ads"><option value="google_ads">Google Ads</option><option value="meta">Meta (Instagram/Facebook)</option><option value="outro">Outro</option></select></div>
        <div className="tf"><label htmlFor="g-c">Campanha</label><input id="g-c" name="campanha" defaultValue="geral" required /></div>
        <div className="tf"><label htmlFor="g-d">Dia</label><input id="g-d" name="dia" type="date" defaultValue={hoje} required /></div>
        <div className="tf"><label htmlFor="g-v">Valor (R$)</label><input id="g-v" name="valor" inputMode="decimal" placeholder="150,00" required /></div>
        <button className="btn btn-brand btn-sm" disabled={pendente} type="submit">Salvar</button>
      </form>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'} style={{ marginTop: 8 }}>{aviso.texto}</p> : null}
    </section>
  )
}
