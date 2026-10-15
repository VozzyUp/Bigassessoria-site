import 'server-only'
import { randomUUID } from 'node:crypto'
import { admin } from '@/lib/supabase/admin'
import { enviarTexto, ErroUazapi } from './uazapi'

type EnviadoPor = 'painel' | 'agente_ia' | 'sistema'

async function tokenDa(instanciaId: string): Promise<string> {
  const { data, error } = await admin().rpc('get_instancia_token', { p_instancia: instanciaId })
  if (error || !data) throw new ErroUazapi('token da instância não encontrado')
  return data as string
}

/** Envia sem registrar na conversa (alertas internos para o vendedor). */
export async function enviarSemRegistro(instanciaId: string, e164: string, texto: string): Promise<void> {
  await enviarTexto(await tokenDa(instanciaId), e164, texto)
}

/**
 * Envia a um lead e grava na conversa. O id devolvido pela UAZAPI é o mesmo que o webhook vai trazer
 * de volta; como a gravação é idempotente por (instância, id), a mensagem não duplica.
 */
export async function enviarAoLead(p: { conversaId: string; texto: string; enviadoPor: EnviadoPor }): Promise<void> {
  const db = admin()
  const { data: c, error } = await db
    .from('conversas')
    .select('id, instancia_id, aguardando_resposta_desde, leads(whatsapp_e164)')
    .eq('id', p.conversaId)
    .single()
  if (error || !c) throw new ErroUazapi('conversa não encontrada')
  const lead = Array.isArray(c.leads) ? c.leads[0] : c.leads
  if (!lead) throw new ErroUazapi('lead da conversa não encontrado')

  const idRemoto = await enviarTexto(await tokenDa(c.instancia_id), lead.whatsapp_e164, p.texto)
  const agora = new Date().toISOString()

  await db.from('mensagens').upsert(
    {
      conversa_id: c.id,
      instancia_id: c.instancia_id,
      uazapi_message_id: idRemoto ?? 'local:' + randomUUID(),
      direcao: 'saida',
      enviado_por: p.enviadoPor,
      tipo: 'texto',
      texto: p.texto,
      enviado_em: agora,
    },
    { onConflict: 'instancia_id,uazapi_message_id', ignoreDuplicates: true },
  )

  const patch: Record<string, unknown> = { ultima_mensagem_em: agora, aguardando_resposta_desde: null }
  if (c.aguardando_resposta_desde && p.enviadoPor === 'painel') {
    patch.primeira_resposta_seg = Math.max(0, Math.round((Date.now() - new Date(c.aguardando_resposta_desde).getTime()) / 1000))
  }
  if (p.enviadoPor === 'painel') {
    // vendedor respondeu pelo painel: o agente de IA para nesta conversa
    patch.agente_ativo = false
    patch.agente_pausado_por = 'vendedor'
    patch.agente_pausado_em = agora
  }
  await db.from('conversas').update(patch).eq('id', c.id)
}
