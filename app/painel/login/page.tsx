'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseNoNavegador } from '@/lib/supabase/browser'
import { MarcaBig } from '@/components/Icone'

const campo: React.CSSProperties = {
  height: 48,
  border: '1.5px solid var(--border-input)',
  borderRadius: 'var(--r-md)',
  padding: '0 14px',
  font: '400 16px var(--sans)',
  width: '100%',
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const { error } = await supabaseNoNavegador().auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }
    router.replace('/painel/conversas')
    router.refresh()
  }

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', padding: 16 }}>
      <form
        onSubmit={entrar}
        style={{ width: 'min(100%, 380px)', display: 'grid', gap: 16, background: 'var(--bg)', padding: 28, borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-raised)' }}
      >
        <span className="logo" style={{ justifySelf: 'start' }}>
          <MarcaBig />
          <span className="w"><b>BIG</b><span>painel</span></span>
        </span>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="email" style={{ font: '600 14px var(--sans)' }}>E-mail</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} style={campo} />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="senha" style={{ font: '600 14px var(--sans)' }}>Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} style={campo} />
        </div>
        {erro ? <p role="alert" style={{ color: 'var(--danger)', fontSize: 14 }}>{erro}</p> : null}
        <button className="btn btn-brand btn-lg" disabled={carregando} aria-busy={carregando}>
          {carregando ? 'Entrando' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
