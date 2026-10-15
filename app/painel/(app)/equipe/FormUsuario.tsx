'use client'

import { useState, useTransition } from 'react'
import { criarUsuario } from '@/app/painel/acoes-gestor'

export function FormUsuario() {
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
          const r = await criarUsuario({
            nome: String(f.get('nome')),
            email: String(f.get('email')),
            senha: String(f.get('senha')),
            papel: String(f.get('papel')),
            whatsapp: String(f.get('whatsapp')),
          })
          setAviso({ ok: r.ok, texto: r.mensagem })
          if (r.ok) form.reset()
        })
      }}
    >
      <h2>Novo usuário</h2>
      <div className="grade2">
        <div className="tf"><label htmlFor="u-n">Nome</label><input id="u-n" name="nome" required /></div>
        <div className="tf"><label htmlFor="u-e">E-mail</label><input id="u-e" name="email" type="email" required /></div>
        <div className="tf"><label htmlFor="u-s">Senha temporária (mín. 10 caracteres)</label><input id="u-s" name="senha" type="password" minLength={10} autoComplete="new-password" required /></div>
        <div className="tf">
          <label htmlFor="u-p">Papel</label>
          <select id="u-p" name="papel" defaultValue="vendedor">
            <option value="vendedor">Vendedor (vê só os próprios contatos)</option>
            <option value="gestor">Gestor (vê tudo e configura)</option>
          </select>
        </div>
        <div className="tf"><label htmlFor="u-w">WhatsApp para receber alertas</label><input id="u-w" name="whatsapp" type="tel" placeholder="(55) 99999-9999" /></div>
      </div>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      <button className="btn btn-brand" type="submit" disabled={pendente}>Criar usuário</button>
    </form>
  )
}
