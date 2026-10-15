import type { Conversao, LeadParaConversao } from './dados'

export class ErroGoogle extends Error {}

let tokenCache: { valor: string; expira: number } | null = null

export async function tokenDeAcessoGoogle(): Promise<string> {
  if (tokenCache && tokenCache.expira > Date.now() + 60_000) return tokenCache.valor
  const id = process.env.GOOGLE_ADS_CLIENT_ID
  const segredo = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refresh = process.env.GOOGLE_ADS_REFRESH_TOKEN
  if (!id || !segredo || !refresh) throw new ErroGoogle('credenciais OAuth do Google Ads não configuradas')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: segredo, refresh_token: refresh, grant_type: 'refresh_token' }),
  })
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number }
  if (!res.ok || !j.access_token) throw new ErroGoogle('falha ao renovar o token do Google (' + res.status + ')')
  tokenCache = { valor: j.access_token, expira: Date.now() + (j.expires_in ?? 3000) * 1000 }
  return j.access_token
}

/** "2026-10-14 21:05:03+00:00", o formato que a API pede. */
function dataGoogle(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '') + '+00:00'
}

/** Qual ação de conversão do Google Ads recebe cada evento do funil (nomes de recurso vêm do ambiente). */
export function acaoDoEvento(evento: string): string | null {
  const mapa: Record<string, string | undefined> = {
    QualifiedLead: process.env.GOOGLE_ADS_ACAO_QUALIFICADO,
    SubmitApplication: process.env.GOOGLE_ADS_ACAO_DOCUMENTACAO,
    Proposal: process.env.GOOGLE_ADS_ACAO_PROPOSTA,
    Purchase: process.env.GOOGLE_ADS_ACAO_CONTRATO,
  }
  return mapa[evento] ?? null
}

/**
 * Upload de conversão offline por clique (gclid/gbraid/wbraid). Sem identificador de clique não há como
 * atribuir ao anúncio: devolve 'sem_clique' e o job marca o evento como ignorado.
 */
export async function enviarGoogle(c: Conversao, lead: LeadParaConversao): Promise<'enviado' | 'sem_clique' | 'sem_acao'> {
  const acao = acaoDoEvento(c.evento)
  if (!acao) return 'sem_acao'
  if (!lead.gclid && !lead.gbraid && !lead.wbraid) return 'sem_clique'

  const dev = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const cliente = (process.env.GOOGLE_ADS_CUSTOMER_ID ?? '').replace(/\D/g, '')
  if (!dev || !cliente) throw new ErroGoogle('GOOGLE_ADS_DEVELOPER_TOKEN/GOOGLE_ADS_CUSTOMER_ID não configurados')
  const token = await tokenDeAcessoGoogle()

  const conv: Record<string, unknown> = {
    conversionAction: acao,
    conversionDateTime: dataGoogle(c.created_at),
    orderId: c.event_id,
    currencyCode: 'BRL',
  }
  if (c.valor_centavos && c.valor_centavos > 0) conv.conversionValue = c.valor_centavos / 100
  if (lead.gclid) conv.gclid = lead.gclid
  else if (lead.gbraid) conv.gbraid = lead.gbraid
  else if (lead.wbraid) conv.wbraid = lead.wbraid

  const versao = process.env.GOOGLE_ADS_API_VERSION ?? 'v21'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
    'developer-token': dev,
  }
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id'] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/\D/g, '')

  const res = await fetch('https://googleads.googleapis.com/' + versao + '/customers/' + cliente + ':uploadClickConversions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ conversions: [conv], partialFailure: true, validateOnly: false }),
  })
  const j = (await res.json().catch(() => ({}))) as { partialFailureError?: { message?: string } }
  if (!res.ok) throw new ErroGoogle('Google Ads respondeu ' + res.status + ': ' + JSON.stringify(j).slice(0, 300))
  if (j.partialFailureError) throw new ErroGoogle('Google Ads recusou: ' + (j.partialFailureError.message ?? '').slice(0, 300))
  return 'enviado'
}
