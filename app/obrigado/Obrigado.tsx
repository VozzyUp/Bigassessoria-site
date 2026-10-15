'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { IconeWhatsApp, Icone } from '@/components/Icone'

type Dados = { url: string | null; fora: boolean; nome: string }

function lerSessao(): string | null {
  try {
    return sessionStorage.getItem('big_wa')
  } catch {
    return null
  }
}
const semAssinatura = () => () => {}

export function Obrigado() {
  const bruto = useSyncExternalStore(semAssinatura, lerSessao, () => null)
  const d = useMemo<Dados | null>(() => {
    try {
      return bruto ? (JSON.parse(bruto) as Dados) : null
    } catch {
      return null
    }
  }, [bruto])

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <p className="eyebrow">Simulação recebida</p>
      <h1 style={{ fontSize: 'clamp(30px,4vw,40px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800 }}>
        {d?.nome ? 'Obrigado, ' + d.nome + '. ' : 'Obrigado. '}Um especialista vai falar com você.
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 17 }}>
        Recebemos os dados da sua simulação. Para agilizar, chame o especialista agora no WhatsApp: ele já vai ter a simulação em mãos.
      </p>
      {d?.fora ? (
        <p role="note" style={{ background: 'var(--warning-soft)', color: 'var(--warning)', padding: 14, borderRadius: 'var(--r-md)' }}>
          Seu imóvel fica fora da nossa região de atendimento atual (MG, SP, MS, MT, PR, SC, RS, RJ e ES). Vamos avisar assim que chegarmos aí.
        </p>
      ) : null}
      {d?.url ? (
        <a className="btn btn-whatsapp btn-lg" href={d.url} style={{ justifySelf: 'start' }}>
          <IconeWhatsApp tamanho={20} />Continuar no WhatsApp
        </a>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>Fique de olho no seu WhatsApp: entraremos em contato em breve.</p>
      )}
      <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', gridTemplateColumns: '1fr' }}>
        <li className="step"><h3>Análise com os bancos</h3><p>Levamos o seu perfil aos bancos parceiros e trazemos as propostas.</p></li>
        <li className="step"><h3>Documentos</h3><p>Quando for a hora, você recebe um código no WhatsApp para enviar os documentos com segurança.</p></li>
      </ol>
      <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icone nome="info" tamanho={14} />A simulação é ilustrativa e depende da análise do banco parceiro.</p>
    </div>
  )
}
