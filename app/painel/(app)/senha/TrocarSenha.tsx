'use client'

import { useState } from 'react'
import { supabaseNoNavegador } from '@/lib/supabase/browser'

export function TrocarSenha() {
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function trocar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const nova = String(f.get('nova'))
    if (nova.length < 10) return setAviso({ ok: false, texto: 'A senha precisa ter ao menos 10 caracteres.' })
    if (nova !== String(f.get('confirma'))) return setAviso({ ok: false, texto: 'As senhas não são iguais.' })
    setEnviando(true)
    const { error } = await supabaseNoNavegador().auth.updateUser({ password: nova })
    setEnviando(false)
    if (error) return setAviso({ ok: false, texto: 'Não foi possível trocar a senha. Entre de novo e tente outra vez.' })
    ;(e.target as HTMLFormElement).reset()
    setAviso({ ok: true, texto: 'Senha alterada.' })
  }

  return (
    <form onSubmit={trocar} className="cartao doc-form" style={{ marginTop: 16, maxWidth: 420 }}>
      <div className="tf"><label htmlFor="s-n">Nova senha</label><input id="s-n" name="nova" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="tf"><label htmlFor="s-c">Repita a nova senha</label><input id="s-c" name="confirma" type="password" autoComplete="new-password" minLength={10} required /></div>
      {aviso ? <p role="status" className={aviso.ok ? 'aviso-ok' : 'aviso-erro'}>{aviso.texto}</p> : null}
      <button className="btn btn-brand" type="submit" disabled={enviando}>Trocar senha</button>
    </form>
  )
}
