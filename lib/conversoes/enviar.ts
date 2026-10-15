import 'server-only'
import { admin } from '@/lib/supabase/admin'
import type { Conversao, LeadParaConversao } from './dados'
import { enviarMeta } from './meta'
import { enviarGoogle } from './google'

const MAX_TENTATIVAS = 6

/** Espera crescente entre tentativas: 1, 2, 4, 8, 16 min... */
const espera = (n: number) => Math.min(2 ** n, 240) * 60_000

/**
 * Lê as conversões pendentes (ou com erro e prontas para nova tentativa) e envia ao Google/Meta.
 * Só envia se o lead deu consentimento para medição de anúncios; senão marca como ignorado.
 */
export async function enviarConversoesPendentes(limite = 25): Promise<{ enviadas: number; ignoradas: number; erros: number }> {
  const db = admin()
  const { data: pendentes } = await db
    .from('conversoes_enviadas')
    .select('id, lead_id, plataforma, evento, event_id, valor_centavos, tentativas, created_at, enviado_em, status')
    .in('status', ['pendente', 'erro'])
    .lt('tentativas', MAX_TENTATIVAS)
    .order('created_at', { ascending: true })
    .limit(limite)

  const r = { enviadas: 0, ignoradas: 0, erros: 0 }
  for (const c of (pendentes ?? []) as (Conversao & { status: string; enviado_em: string | null })[]) {
    // retentativa com espera crescente (usa enviado_em como "última tentativa")
    if (c.status === 'erro' && c.enviado_em && Date.now() - new Date(c.enviado_em).getTime() < espera(c.tentativas)) continue

    const { data: lead } = await db
      .from('leads')
      .select('id, whatsapp_e164, nome, email, gclid, gbraid, wbraid, fbp, fbc, uf, consentimento_anuncios')
      .eq('id', c.lead_id)
      .maybeSingle()
    if (!lead) {
      await db.from('conversoes_enviadas').update({ status: 'ignorado', erro: 'lead removido' }).eq('id', c.id)
      r.ignoradas++
      continue
    }
    if (!lead.consentimento_anuncios) {
      await db.from('conversoes_enviadas').update({ status: 'ignorado', erro: 'sem consentimento para anúncios' }).eq('id', c.id)
      r.ignoradas++
      continue
    }

    try {
      if (c.plataforma === 'meta') {
        await enviarMeta(c, lead as LeadParaConversao)
      } else {
        const res = await enviarGoogle(c, lead as LeadParaConversao)
        if (res !== 'enviado') {
          await db.from('conversoes_enviadas').update({ status: 'ignorado', erro: res === 'sem_clique' ? 'lead sem gclid/gbraid/wbraid' : 'ação de conversão não configurada' }).eq('id', c.id)
          r.ignoradas++
          continue
        }
      }
      await db.from('conversoes_enviadas').update({ status: 'enviado', enviado_em: new Date().toISOString(), erro: null, tentativas: c.tentativas + 1 }).eq('id', c.id)
      r.enviadas++
    } catch (e) {
      await db
        .from('conversoes_enviadas')
        .update({ status: 'erro', erro: String(e instanceof Error ? e.message : e).slice(0, 500), tentativas: c.tentativas + 1, enviado_em: new Date().toISOString() })
        .eq('id', c.id)
      r.erros++
    }
  }
  return r
}
