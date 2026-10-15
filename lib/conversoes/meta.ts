import { emailHash, nomeHash, telefoneHash, type Conversao, type LeadParaConversao } from './dados'

// Eventos do funil -> nomes na Meta. QualifiedLead e Proposal são eventos personalizados.
const NOME_META: Record<string, string> = {
  Lead: 'Lead',
  QualifiedLead: 'QualifiedLead',
  SubmitApplication: 'SubmitApplication',
  Proposal: 'Proposal',
  Purchase: 'Purchase',
}

export class ErroMeta extends Error {}

/**
 * Meta Conversions API. `Lead` vem do site (action_source website); as etapas seguintes vêm do CRM
 * (system_generated). O event_id é o mesmo do navegador para a Meta deduplicar.
 */
export async function enviarMeta(c: Conversao, lead: LeadParaConversao): Promise<void> {
  const pixel = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixel || !token) throw new ErroMeta('META_PIXEL_ID/META_CAPI_TOKEN não configurados')

  const userData: Record<string, unknown> = {
    ph: [telefoneHash(lead.whatsapp_e164)],
    external_id: [lead.id],
    country: ['br'],
  }
  if (lead.email) {
    const em = emailHash(lead.email)
    if (em) userData.em = [em]
  }
  if (lead.nome) {
    const fn = nomeHash(lead.nome.split(' ')[0])
    if (fn) userData.fn = [fn]
  }
  if (lead.fbp) userData.fbp = lead.fbp
  if (lead.fbc) userData.fbc = lead.fbc

  const evento: Record<string, unknown> = {
    event_name: NOME_META[c.evento] ?? c.evento,
    event_time: Math.floor(new Date(c.created_at).getTime() / 1000),
    event_id: c.event_id,
    action_source: c.evento === 'Lead' ? 'website' : 'system_generated',
    user_data: userData,
  }
  if (c.evento === 'Lead') evento.event_source_url = process.env.NEXT_PUBLIC_SITE_URL
  if (c.valor_centavos && c.valor_centavos > 0) {
    evento.custom_data = { value: c.valor_centavos / 100, currency: 'BRL' }
  }

  const versao = process.env.META_API_VERSION ?? 'v21.0'
  const corpo: Record<string, unknown> = { data: [evento] }
  if (process.env.META_TEST_EVENT_CODE) corpo.test_event_code = process.env.META_TEST_EVENT_CODE

  const res = await fetch('https://graph.facebook.com/' + versao + '/' + pixel + '/events?access_token=' + encodeURIComponent(token), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new ErroMeta('Meta respondeu ' + res.status + ': ' + txt.slice(0, 300))
  }
}
