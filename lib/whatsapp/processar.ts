import 'server-only'
import { admin } from '@/lib/supabase/admin'
import { paraE164, variantes } from '@/lib/telefone'
import type { MensagemEntrada } from './uazapi'

export type Resultado =
  | { ok: true; acao: 'gravada'; leadId: string; conversaId: string }
  | { ok: true; acao: 'duplicada' | 'descartada'; motivo: string }

/**
 * Regra de privacidade (LGPD): só entra no banco a conversa de quem já é lead.
 * Contatos pessoais e grupos são descartados ANTES de qualquer gravação.
 * Um contato desconhecido só vira lead se a primeira mensagem trouxer o marcador de um link rastreável.
 */
export async function processarMensagem(instanciaNome: string, m: MensagemEntrada): Promise<Resultado> {
  if (m.isGroup) return { ok: true, acao: 'descartada', motivo: 'grupo' }
  const e164 = paraE164(m.telefone)
  if (!e164) return { ok: true, acao: 'descartada', motivo: 'telefone_invalido' }

  const db = admin()

  const { data: instancia } = await db
    .from('instancias')
    .select('id, usuario_id')
    .eq('uazapi_instance', instanciaNome)
    .maybeSingle()
  if (!instancia) return { ok: true, acao: 'descartada', motivo: 'instancia_desconhecida' }

  // 1) já é lead?
  let { data: lead } = await db
    .from('leads')
    .select('id, etapa, usuario_id')
    .in('whatsapp_e164', variantes(e164))
    .limit(1)
    .maybeSingle()

  // 2) senão, a mensagem traz o marcador de um canal?
  if (!lead && !m.fromMe && m.texto) {
    const { data: canais } = await db.from('canais').select('id, marcador').eq('ativo', true)
    const canal = canais?.find((c) => m.texto!.includes(c.marcador))
    if (canal) {
      const toque = { canal: canal.marcador, via: 'whatsapp', em: new Date().toISOString() }
      const { data: novo, error } = await db
        .from('leads')
        .insert({
          whatsapp_e164: e164,
          nome: m.nome,
          usuario_id: instancia.usuario_id,
          canal_id: canal.id,
          primeiro_toque: toque,
          ultimo_toque: toque,
          ultimo_contato_em: new Date().toISOString(),
        })
        .select('id, etapa, usuario_id')
        .single()
      if (error) throw error
      lead = novo
    }
  }
  if (!lead) return { ok: true, acao: 'descartada', motivo: 'nao_e_lead' }

  // conversa (um lead pode falar com mais de uma instância)
  const { data: conversa, error: errConv } = await db
    .from('conversas')
    .upsert({ lead_id: lead.id, instancia_id: instancia.id }, { onConflict: 'lead_id,instancia_id' })
    .select('id, aguardando_resposta_desde')
    .single()
  if (errConv) throw errConv

  const quando = new Date(m.timestamp).toISOString()
  const enviadoPor = !m.fromMe ? 'cliente' : m.viaApi ? 'painel' : 'aparelho'

  // idempotência: o mesmo webhook pode chegar duas vezes
  const { data: gravada, error: errMsg } = await db
    .from('mensagens')
    .upsert(
      {
        conversa_id: conversa.id,
        instancia_id: instancia.id,
        uazapi_message_id: m.id,
        direcao: m.fromMe ? 'saida' : 'entrada',
        enviado_por: enviadoPor,
        tipo: m.tipo,
        texto: m.texto,
        enviado_em: quando,
      },
      { onConflict: 'instancia_id,uazapi_message_id', ignoreDuplicates: true },
    )
    .select('id')
  if (errMsg) throw errMsg
  if (!gravada?.length) return { ok: true, acao: 'duplicada', motivo: 'mensagem_ja_gravada' }

  // estado da conversa
  const patch: Record<string, unknown> = { ultima_mensagem_em: quando }
  if (!m.fromMe) {
    patch.aguardando_resposta_desde = conversa.aguardando_resposta_desde ?? quando
  } else {
    if (conversa.aguardando_resposta_desde) {
      const seg = (m.timestamp - new Date(conversa.aguardando_resposta_desde).getTime()) / 1000
      patch.primeira_resposta_seg = Math.max(0, Math.round(seg))
    }
    patch.aguardando_resposta_desde = null
    // o vendedor assumiu pelo celular: o agente de IA para nesta conversa
    if (enviadoPor === 'aparelho') {
      patch.agente_pausado_por = 'vendedor'
      patch.agente_pausado_em = new Date().toISOString()
      patch.agente_ativo = false
    }
  }
  await db.from('conversas').update(patch).eq('id', conversa.id)

  const leadPatch: Record<string, unknown> = { ultimo_contato_em: quando }
  if (m.fromMe && lead.etapa === 'novo') leadPatch.etapa = 'em_atendimento'
  await db.from('leads').update(leadPatch).eq('id', lead.id)

  return { ok: true, acao: 'gravada', leadId: lead.id, conversaId: conversa.id }
}
