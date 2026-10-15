'use server'

import { revalidatePath } from 'next/cache'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'
import { enviarCodigo } from '@/lib/documentos/liberar'
import { enviarAoLead } from '@/lib/whatsapp/enviar'

const UUID = /^[0-9a-f-]{36}$/

/** Confere, com o RLS do usuário logado, se ele pode mexer neste lead. Devolve o id do usuário. */
async function autorizar(leadId: string): Promise<string | null> {
  if (!UUID.test(leadId)) return null
  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase.from('leads').select('id').eq('id', leadId).maybeSingle()
  return data ? auth.user.id : null
}

export async function liberarDocumentos(leadId: string): Promise<{ ok: boolean; mensagem: string }> {
  const uid = await autorizar(leadId)
  if (!uid) return { ok: false, mensagem: 'Sem permissão para este contato.' }
  const r = await enviarCodigo(leadId, uid, { avancarEtapa: true })
  revalidatePath('/painel/leads/' + leadId)
  if (r.ok) return { ok: true, mensagem: 'Código enviado pelo WhatsApp.' }
  if (r.motivo === 'sem_conversa') return { ok: false, mensagem: 'Não há número conectado para falar com este cliente. Conecte o WhatsApp do vendedor.' }
  return { ok: false, mensagem: 'Não foi possível enviar o código agora.' }
}

export async function revogarCodigo(leadId: string): Promise<{ ok: boolean; mensagem: string }> {
  const uid = await autorizar(leadId)
  if (!uid) return { ok: false, mensagem: 'Sem permissão para este contato.' }
  await admin().from('codigos_acesso').update({ revogado_em: new Date().toISOString() }).eq('lead_id', leadId).is('usado_em', null).is('revogado_em', null)
  await admin().from('audit_log').insert({ lead_id: leadId, ator: 'usuario', usuario_id: uid, acao: 'codigo.revogado' })
  revalidatePath('/painel/leads/' + leadId)
  return { ok: true, mensagem: 'Código revogado.' }
}

export async function revisarDocumento(leadId: string, itemId: string, aprovado: boolean, motivo: string): Promise<{ ok: boolean; mensagem: string }> {
  const uid = await autorizar(leadId)
  if (!uid || !UUID.test(itemId)) return { ok: false, mensagem: 'Sem permissão para este contato.' }
  if (!aprovado && motivo.trim().length < 3) return { ok: false, mensagem: 'Explique ao cliente o que precisa ser enviado de novo.' }

  const supabase = await supabaseDoUsuario()
  const { error } = await supabase
    .from('documento_itens')
    .update({
      status: aprovado ? 'aprovado' : 'rejeitado',
      motivo_rejeicao: aprovado ? null : motivo.trim().slice(0, 300),
      revisado_por: uid,
      revisado_em: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('lead_id', leadId)
  if (error) return { ok: false, mensagem: 'Não foi possível salvar a revisão.' }

  const db = admin()
  await db.from('audit_log').insert({ lead_id: leadId, ator: 'usuario', usuario_id: uid, acao: aprovado ? 'doc.aprovado' : 'doc.rejeitado', detalhes: { item: itemId } })

  if (!aprovado) {
    // avisa o cliente pelo WhatsApp, na conversa existente
    const { data: conv } = await db
      .from('conversas')
      .select('id')
      .eq('lead_id', leadId)
      .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    if (conv) {
      const aviso =
        'Precisamos que você envie um documento de novo: ' + motivo.trim().slice(0, 200) +
        ' Se precisar de um novo código, peça em ' + (process.env.NEXT_PUBLIC_SITE_URL ?? '') + '/documentos.'
      await enviarAoLead({ conversaId: conv.id, enviadoPor: 'sistema', texto: aviso }).catch((e) => console.error('aviso de rejeição', e))
    }
  } else {
    // todos os obrigatórios aprovados: o contato vai para Análise no banco
    const { data: itens } = await db.from('documento_itens').select('status, documento_tipos(obrigatorio, so_se_financiado)').eq('lead_id', leadId)
    type T = { obrigatorio: boolean; so_se_financiado: boolean } | null
    const pendentes = (itens ?? []).filter((i) => {
      const t = (Array.isArray(i.documento_tipos) ? i.documento_tipos[0] : i.documento_tipos) as T
      return t?.obrigatorio && !t.so_se_financiado && i.status !== 'aprovado'
    })
    if (!pendentes.length) await supabase.from('leads').update({ etapa: 'analise' }).eq('id', leadId).eq('etapa', 'documentacao')
  }
  revalidatePath('/painel/leads/' + leadId)
  return { ok: true, mensagem: aprovado ? 'Documento aprovado.' : 'Documento recusado e cliente avisado.' }
}
