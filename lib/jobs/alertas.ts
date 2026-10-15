import 'server-only'
import { admin } from '@/lib/supabase/admin'
import { lerConfig } from '@/lib/config'
import { enviarSemRegistro } from '@/lib/whatsapp/enviar'
import { mascarar } from '@/lib/telefone'

interface ConfigAlertas {
  quente_sem_resposta_min: number
  parado_documentacao_dias: number
}

/** Evita repetir o mesmo alerta: consulta o audit_log antes de enviar. */
async function jaAvisou(acao: string, leadId: string | null, janelaMin: number): Promise<boolean> {
  const desde = new Date(Date.now() - janelaMin * 60_000).toISOString()
  let q = admin().from('audit_log').select('id', { head: true, count: 'exact' }).eq('acao', acao).gte('created_at', desde)
  q = leadId ? q.eq('lead_id', leadId) : q.is('lead_id', null)
  const { count } = await q
  return (count ?? 0) > 0
}

async function registrar(acao: string, leadId: string | null, detalhes: Record<string, unknown>) {
  await admin().from('audit_log').insert({ lead_id: leadId, ator: 'sistema', acao, detalhes })
}

/** Instância conectada de um usuário (de onde o alerta sai). */
async function instanciaDe(usuarioId: string): Promise<string | null> {
  const { data } = await admin().from('instancias').select('id').eq('usuario_id', usuarioId).eq('status', 'conectada').limit(1).maybeSingle()
  return data?.id ?? null
}

export async function verificarAlertas(): Promise<{ enviados: number }> {
  const cfg = await lerConfig<ConfigAlertas>('alertas', { quente_sem_resposta_min: 15, parado_documentacao_dias: 3 })
  const db = admin()
  let enviados = 0

  // 1) cliente esperando resposta há mais de N minutos
  const limite = new Date(Date.now() - cfg.quente_sem_resposta_min * 60_000).toISOString()
  const { data: esperando } = await db
    .from('conversas')
    .select('id, aguardando_resposta_desde, leads!inner(id, nome, whatsapp_e164, etapa, usuario_id, temperatura)')
    .lt('aguardando_resposta_desde', limite)
    .not('aguardando_resposta_desde', 'is', null)
    .limit(50)
  for (const c of esperando ?? []) {
    const lead = Array.isArray(c.leads) ? c.leads[0] : c.leads
    if (!lead?.usuario_id || ['liberado', 'perdido'].includes(lead.etapa)) continue
    if (await jaAvisou('alerta.sem_resposta', lead.id, 60)) continue
    const { data: u } = await db.from('usuarios').select('whatsapp_alerta').eq('id', lead.usuario_id).maybeSingle()
    const inst = await instanciaDe(lead.usuario_id)
    if (!u?.whatsapp_alerta || !inst) continue
    const min = Math.round((Date.now() - new Date(c.aguardando_resposta_desde as string).getTime()) / 60000)
    try {
      await enviarSemRegistro(inst, u.whatsapp_alerta, 'Atenção: ' + (lead.nome ?? mascarar(lead.whatsapp_e164)) + ' está esperando resposta há ' + min + ' min.')
      await registrar('alerta.sem_resposta', lead.id, { minutos: min })
      enviados++
    } catch (e) {
      console.error('alerta sem_resposta', e)
    }
  }

  // 2) parado em Documentação há mais de N dias
  const parado = new Date(Date.now() - cfg.parado_documentacao_dias * 86_400_000).toISOString()
  const { data: docs } = await db.from('leads').select('id, nome, whatsapp_e164, usuario_id').eq('etapa', 'documentacao').lt('etapa_em', parado).limit(50)
  for (const lead of docs ?? []) {
    if (!lead.usuario_id || (await jaAvisou('alerta.parado_documentacao', lead.id, 24 * 60))) continue
    const { data: u } = await db.from('usuarios').select('whatsapp_alerta').eq('id', lead.usuario_id).maybeSingle()
    const inst = await instanciaDe(lead.usuario_id)
    if (!u?.whatsapp_alerta || !inst) continue
    try {
      await enviarSemRegistro(inst, u.whatsapp_alerta, (lead.nome ?? mascarar(lead.whatsapp_e164)) + ' está parado em Documentação há mais de ' + cfg.parado_documentacao_dias + ' dias.')
      await registrar('alerta.parado_documentacao', lead.id, {})
      enviados++
    } catch (e) {
      console.error('alerta parado_documentacao', e)
    }
  }

  // 3) número desconectado: avisa os gestores, a partir de uma instância que esteja conectada
  const { data: caidas } = await db.from('instancias').select('id, numero_e164, usuarios(nome)').eq('status', 'desconectada')
  if (caidas?.length && !(await jaAvisou('alerta.instancia_caiu', null, 6 * 60))) {
    const { data: gestores } = await db.from('usuarios').select('id, whatsapp_alerta').eq('papel', 'gestor').eq('ativo', true)
    const { data: viva } = await db.from('instancias').select('id').eq('status', 'conectada').limit(1).maybeSingle()
    const nomes = caidas.map((i) => (Array.isArray(i.usuarios) ? i.usuarios[0]?.nome : (i.usuarios as { nome?: string } | null)?.nome) ?? i.numero_e164 ?? 'sem nome').join(', ')
    if (viva) {
      for (const g of gestores ?? []) {
        if (!g.whatsapp_alerta) continue
        try {
          await enviarSemRegistro(viva.id, g.whatsapp_alerta, 'WhatsApp desconectado: ' + nomes + '. Reconecte em Painel > Conexões.')
          enviados++
        } catch (e) {
          console.error('alerta instancia_caiu', e)
        }
      }
      await registrar('alerta.instancia_caiu', null, { instancias: caidas.length })
    }
  }
  return { enviados }
}
