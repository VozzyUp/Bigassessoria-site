'use client'
import type { Atribuicao } from './tipos'

const CHAVE_VISITANTE = 'big_vid'
const CHAVE_PRIMEIRO = 'big_ft'

function cookie(nome: string): string | undefined {
  const m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : undefined
}

function seguro<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}

/** Lê UTM, gclid, fbclid, cookies da Meta e o primeiro toque. Nunca lança: sem storage, devolve o que der. */
export function coletarAtribuicao(): Atribuicao {
  const q = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  q.forEach((v, k) => {
    if (k.startsWith('utm_')) utm[k] = v.slice(0, 200)
  })

  let visitanteId = seguro(() => localStorage.getItem(CHAVE_VISITANTE)) ?? undefined
  if (!visitanteId) {
    visitanteId = crypto.randomUUID()
    const novo = visitanteId
    seguro(() => localStorage.setItem(CHAVE_VISITANTE, novo))
  }

  const atual = {
    utm,
    gclid: q.get('gclid') ?? undefined,
    gbraid: q.get('gbraid') ?? undefined,
    wbraid: q.get('wbraid') ?? undefined,
    fbclid: q.get('fbclid') ?? undefined,
    landing: window.location.pathname,
    em: new Date().toISOString(),
  }
  const temSinal = Object.keys(utm).length > 0 || !!(atual.gclid || atual.fbclid || atual.gbraid || atual.wbraid)

  let primeiro = seguro(() => JSON.parse(localStorage.getItem(CHAVE_PRIMEIRO) ?? 'null')) as Record<string, unknown> | null | undefined
  const primeiroSemSinal =
    !!primeiro && !primeiro.gclid && !primeiro.fbclid && Object.keys((primeiro.utm as object) ?? {}).length === 0
  if (!primeiro || (temSinal && primeiroSemSinal)) {
    primeiro = { ...atual, referrer: document.referrer || undefined }
    const grava = primeiro
    seguro(() => localStorage.setItem(CHAVE_PRIMEIRO, JSON.stringify(grava)))
  }

  // se o clique atual tem sinal, ele é o "último toque"; senão repete o primeiro
  const ultimo = (temSinal ? atual : primeiro) as typeof atual
  return {
    visitanteId,
    landing: atual.landing,
    utm: ultimo.utm ?? {},
    gclid: ultimo.gclid ?? undefined,
    gbraid: ultimo.gbraid ?? undefined,
    wbraid: ultimo.wbraid ?? undefined,
    fbclid: ultimo.fbclid ?? undefined,
    fbp: cookie('_fbp'),
    fbc: cookie('_fbc'),
    primeiroToque: primeiro ?? undefined,
  }
}
