'use client'
// Consentimento de cookies (LGPD) ligado ao Google Consent Mode v2.
// Padrão: tudo negado até o visitante escolher. A escolha vale 12 meses e fica só neste navegador.

export type Escolha = { estatistica: boolean; marketing: boolean; em: string }

const CHAVE = 'big_consent'

type DataLayerItem = Record<string, unknown> | IArguments
declare global {
  interface Window {
    dataLayer?: DataLayerItem[]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function gtag(..._args: unknown[]) {
  // o GTM exige o objeto `arguments`, não um array
  // eslint-disable-next-line prefer-rest-params
  ;(window.dataLayer ??= []).push(arguments)
}

export function lerEscolha(): Escolha | null {
  try {
    const e = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Escolha | null
    if (!e) return null
    const idadeDias = (Date.now() - new Date(e.em).getTime()) / 86_400_000
    return idadeDias > 365 ? null : e
  } catch {
    return null
  }
}

export function aplicar(e: Escolha) {
  const s = (v: boolean) => (v ? 'granted' : 'denied')
  gtag('consent', 'update', {
    analytics_storage: s(e.estatistica),
    ad_storage: s(e.marketing),
    ad_user_data: s(e.marketing),
    ad_personalization: s(e.marketing),
  })
}

export function salvar(e: Escolha) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e))
  } catch {
    // sem storage a escolha vale só até recarregar a página
  }
  aplicar(e)
  window.dispatchEvent(new Event('big-consent'))
}

/** Evento de medição. Só chega às plataformas se o consentimento permitir (quem decide é o GTM + Consent Mode). */
export function evento(nome: string, dados: Record<string, unknown> = {}) {
  ;(window.dataLayer ??= []).push({ event: nome, ...dados })
}
