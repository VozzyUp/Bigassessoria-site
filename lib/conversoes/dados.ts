import { createHash } from 'node:crypto'

export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

/** Telefone para a Meta: só dígitos, com o 55 na frente, sem o +. */
export function telefoneHash(e164: string): string {
  return sha256(e164.replace(/\D/g, ''))
}

/** E-mail para a Meta e o Google: minúsculo, sem espaços. */
export function emailHash(email: string): string | null {
  const e = email.trim().toLowerCase()
  return e.includes('@') ? sha256(e) : null
}

/** Nome para a Meta: minúsculo, sem acento, só letras. */
export function nomeHash(nome: string): string | null {
  const n = nome.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
  return n ? sha256(n) : null
}

export interface LeadParaConversao {
  id: string
  whatsapp_e164: string
  nome: string | null
  email: string | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  fbp: string | null
  fbc: string | null
  uf: string | null
  consentimento_anuncios: boolean
}

export interface Conversao {
  id: string
  lead_id: string
  plataforma: 'google_ads' | 'meta'
  evento: string
  event_id: string
  valor_centavos: number | null
  tentativas: number
  created_at: string
}
