'use server'

import { revalidatePath } from 'next/cache'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'
import { enviarAoLead } from '@/lib/whatsapp/enviar'
type Retorno = { ok: boolean; mensagem: string }

const UUID = /^[0-9a-f-]{36}$/

async function usuarioDaConversa(conversaId: string) {
  if (!UUID.test(conversaId)) return null
  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  // o RLS só devolve a conversa se o usuário puder ver o lead
  const { data } = await supabase.from('conversas').select('id, lead_id').eq('id', conversaId).maybeSingle()
  return data ? { uid: auth.user.id, leadId: data.lead_id as string } : null
}

export async function responderPeloPainel(conversaId: string, texto: string): Promise<Retorno> {
  const ctx = await usuarioDaConversa(conversaId)
  if (!ctx) return { ok: false, mensagem: 'Sem permissão para esta conversa.' }
  const limpo = texto.trim()
  if (!limpo) return { ok: false, mensagem: 'Escreva a mensagem.' }
  if (limpo.length > 2000) return { ok: false, mensagem: 'Mensagem longa demais (máximo 2000 caracteres).' }
  try {
    await enviarAoLead({ conversaId, texto: limpo, enviadoPor: 'painel' })
  } catch (e) {
    console.error('responder pelo painel', e)
    return { ok: false, mensagem: 'Não foi possível enviar. Confira se o WhatsApp do vendedor está conectado.' }
  }
  revalidatePath('/painel/leads/' + ctx.leadId)
  return { ok: true, mensagem: 'Enviado.' }
}

export async function alternarAgente(conversaId: string, ativo: boolean): Promise<Retorno> {
  const ctx = await usuarioDaConversa(conversaId)
  if (!ctx) return { ok: false, mensagem: 'Sem permissão para esta conversa.' }
  await admin()
    .from('conversas')
    .update(ativo ? { agente_ativo: true, agente_pausado_por: null, agente_pausado_em: null, agente_msgs_enviadas: 0 } : { agente_ativo: false, agente_pausado_por: 'vendedor', agente_pausado_em: new Date().toISOString() })
    .eq('id', conversaId)
  revalidatePath('/painel/leads/' + ctx.leadId)
  return { ok: true, mensagem: ativo ? 'Agente de IA ligado nesta conversa.' : 'Agente de IA desligado nesta conversa.' }
}
