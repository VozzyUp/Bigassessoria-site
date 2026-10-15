'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const mascara = (txt: string) => {
  const d = txt.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2)
  if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6)
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7)
}

export function CodigoForm() {
  const router = useRouter()
  const [whats, setWhats] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setEnviando(true)
    const res = await fetch('/api/documentos/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: whats, codigo }),
    }).catch(() => null)
    if (res?.ok) {
      router.replace('/documentos/enviar')
      router.refresh()
      return
    }
    setEnviando(false)
    if (res?.status === 429) setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
    else if (res?.status === 400) setErro('Confira o código de 6 dígitos.')
    else setErro('Código inválido ou vencido. Confira os números ou peça um novo código.')
  }

  async function novoCodigo() {
    setErro(null)
    setAviso(null)
    await fetch('/api/documentos/codigo/reenviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: whats }),
    }).catch(() => null)
    setAviso('Se este número tem documentos para enviar, um novo código chega no WhatsApp em instantes.')
  }

  return (
    <form onSubmit={entrar} className="doc-form" noValidate>
      <div className="tf">
        <label htmlFor="d-wa">WhatsApp</label>
        <input id="d-wa" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(55) 99999-9999" value={whats} onChange={(e) => setWhats(mascara(e.target.value))} />
      </div>
      <div className="tf">
        <label htmlFor="d-cod">Código de 6 dígitos</label>
        <input id="d-cod" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{ letterSpacing: '0.4em', fontWeight: 700, fontSize: 22 }} />
      </div>
      {erro ? <p role="alert" className="aviso-erro">{erro}</p> : null}
      {aviso ? <p role="status" className="aviso-ok">{aviso}</p> : null}
      <button className="btn btn-brand btn-lg" disabled={enviando || codigo.length !== 6 || whats.replace(/\D/g, '').length < 10} aria-busy={enviando}>
        {enviando ? 'Entrando' : 'Entrar'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={novoCodigo} disabled={whats.replace(/\D/g, '').length < 10}>
        Pedir um novo código
      </button>
    </form>
  )
}
