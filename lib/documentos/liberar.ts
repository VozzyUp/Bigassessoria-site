import 'server-only'
import { admin } from '@/lib/supabase/admin'
import { enviarAoLead } from '@/lib/whatsapp/enviar'
import { gerarCodigo, hashCodigo } from './seguranca'
import { variantes } from '@/lib/telefone'

const VALIDADE_HORAS = 24

export type ResultadoCodigo = { ok: true } | { ok: false; motivo: 'lead_nao_encontrado' | 'sem_conversa' | 'falha_envio' }

async function conversaDoLead(leadId: string): Promise<string | null> {
  const db = admin()
  const { data: existente } = await db.from('conversas').select('id').eq('lead_id', leadId).order('ultima_mensagem_em', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
  if (existente) return existente.id
  // lead do site que ainda não falou no WhatsApp: abre a conversa na instância conectada do vendedor
  const { data: lead } = await db.from('leads').select('usuario_id').eq('id', leadId).maybeSingle()
  if (!lead?.usuario_id) return null
  const { data: inst } = await db.from('instancias').select('id').eq('usuario_id', lead.usuario_id).eq('status', 'conectada').limit(1).maybeSingle()
  if (!inst) return null
  const { data: nova } = await db.from('conversas').upsert({ lead_id: leadId, instancia_id: inst.id }, { onConflict: 'lead_id,instancia_id' }).select('id').single()
  return nova?.id ?? null
}

/** Cria o checklist (se ainda não existe), gera um código novo, revoga o anterior e envia pelo WhatsApp. */
export async function enviarCodigo(leadId: string, criadoPor: string | null, opcoes: { avancarEtapa?: boolean } = {}): Promise<ResultadoCodigo> {
  const db = admin()
  const { data: lead } = await db.from('leads').select('id, nome, whatsapp_e164, etapa').eq('id', leadId).maybeSingle()
  if (!lead) return { ok: false, motivo: 'lead_nao_encontrado' }

  const conversaId = await conversaDoLead(leadId)
  if (!conversaId) return { ok: false, motivo: 'sem_conversa' }

  // checklist: um item por tipo de documento ativo
  const { data: tipos } = await db.from('documento_tipos').select('id').eq('ativo', true)
  if (tipos?.length) {
    await db.from('documento_itens').upsert(tipos.map((t) => ({ lead_id: leadId, tipo_id: t.id })), { onConflict: 'lead_id,tipo_id', ignoreDuplicates: true })
  }

  // um código ativo por lead: revoga o anterior e cria o novo
  await db.from('codigos_acesso').update({ revogado_em: new Date().toISOString() }).eq('lead_id', leadId).is('usado_em', null).is('revogado_em', null)
  const codigo = gerarCodigo()
  const { error } = await db.from('codigos_acesso').insert({
    lead_id: leadId,
    whatsapp_e164: lead.whatsapp_e164,
    codigo_hash: hashCodigo(lead.whatsapp_e164, codigo),
    expira_em: new Date(Date.now() + VALIDADE_HORAS * 3_600_000).toISOString(),
    criado_por: criadoPor,
  })
  if (error) throw error

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const primeiro = (lead.nome ?? '').split(' ')[0]
  const texto =
    (primeiro ? 'Olá, ' + primeiro + '! ' : 'Olá! ') +
    'Para enviar seus documentos com segurança, acesse ' + site + '/documentos e use o código ' + codigo + '. ' +
    'Ele vale por ' + VALIDADE_HORAS + ' horas e é só seu: não compartilhe com ninguém.'
  try {
    await enviarAoLead({ conversaId, texto, enviadoPor: 'sistema' })
  } catch (e) {
    console.error('envio do código falhou', e)
    await db.from('codigos_acesso').update({ revogado_em: new Date().toISOString() }).eq('lead_id', leadId).is('usado_em', null)
    return { ok: false, motivo: 'falha_envio' }
  }

  await db.from('audit_log').insert({ lead_id: leadId, ator: criadoPor ? 'usuario' : 'sistema', usuario_id: criadoPor, acao: 'codigo.enviado' })
  if (opcoes.avancarEtapa && ['novo', 'em_atendimento', 'qualificado'].includes(lead.etapa)) {
    await db.from('leads').update({ etapa: 'documentacao' }).eq('id', leadId)
  }
  return { ok: true }
}

/** Procura o lead por qualquer variante do número (com e sem o 9). */
export async function leadPorTelefone(e164: string): Promise<{ id: string; etapa: string } | null> {
  const { data } = await admin().from('leads').select('id, etapa').in('whatsapp_e164', variantes(e164)).limit(1).maybeSingle()
  return data
}
