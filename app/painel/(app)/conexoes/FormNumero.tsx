'use client'

import { useState, useTransition } from 'react'
import { cadastrarNumero } from '@/app/painel/acoes-gestor'

export function FormNumero({ vendedores }: { vendedores: { id: string; nome: string }[] }) {
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  return (
    <form
      className="cartao doc-form"
      style={{ marginTop: 12, maxWidth: 720 }}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const form = e.currentTarget
        iniciar(async () => {
          const r = await cadastrarNumero({
            usuarioId: String(f.get('usuario')),
            instancia: String(f.get('instancia')),
            token: String(f.get('token')),
            numero: String(f.get('numero')),
          })
          setAviso({ ok: r.ok, texto: r.mensagem })
          if (r.ok) form.reset()
        })
      }}
    >
      <h2>Cadastrar número</h2>
      <div className="grade2">
        <div className="tf">
          <label htmlFor="n-u">Vendedor</label>
          <select id="n-u" name="usuario" required defaultValue="">
            <option value="" disabled>Selecione</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </div>
        <div className="tf"><label htmlFor="n-n">WhatsApp do vendedor</label><input id="n-n" name="numero" type="tel" placeholder="(55) 99999-9999" required /></div>
        <div className="tf"><label htmlFor="n-i">Nome da instância na UAZAPI</label><input id="n-i" name="instancia" required /></div>
        <div className="tf">
          <label htmlFor="n-t">Token da instância</label>
          <input id="n-t" name="token" type="password" autoComplete="off" required />
          <span className="msg">Fica guardado criptografado. Não é mostrado de novo.</span>
        </div>
      </div>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      <button className="btn btn-brand" type="submit" disabled={pendente}>Cadastrar</button>
    </form>
  )
}
