'use server'

import { revalidatePath } from 'next/cache'
import { admin } from '@/lib/supabase/admin'
import { exigirGestor } from '@/lib/painel/gestor'
import { paraE164 } from '@/lib/telefone'

type Ret = { ok: boolean; mensagem: string }
const NEGADO: Ret = { ok: false, mensagem: 'Só o gestor pode fazer isso.' }
const UUID = /^[0-9a-f-]{36}$/

export async function lancarGasto(plataforma: string, campanha: string, dia: string, valor: string): Promise<Ret> {
  if (!(await exigirGestor())) return NEGADO
  if (!['google_ads', 'meta', 'outro'].includes(plataforma)) return { ok: false, mensagem: 'Plataforma inválida.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return { ok: false, mensagem: 'Data inválida.' }
  const reais = Number(valor.replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(reais) || reais < 0 || reais > 10_000_000) return { ok: false, mensagem: 'Valor inválido.' }
  const nome = campanha.trim().slice(0, 120) || 'geral'
  const { error } = await admin()
    .from('gastos_anuncio')
    .upsert({ plataforma, campanha: nome, dia, valor_centavos: Math.round(reais * 100), origem: 'manual' }, { onConflict: 'plataforma,campanha,dia' })
  if (error) return { ok: false, mensagem: 'Não foi possível salvar.' }
  revalidatePath('/painel/dashboard')
  return { ok: true, mensagem: 'Gasto salvo.' }
}

/** Salva a configuração do simulador (taxa mínima, opções de taxa, percentual do imóvel, prazos) e os estados atendidos. */
export async function salvarSimulador(f: { taxaMin: string; taxas: string; ltvHe: string; ltvFin: string; prazos: string; ufs: string }): Promise<Ret> {
  const uid = await exigirGestor()
  if (!uid) return NEGADO
  const num = (s: string) => Number(s.replace(',', '.'))
  const lista = (s: string) =>
    s
      .split(/[;\s]+/)
      .map((x) => num(x))
      .filter((n) => Number.isFinite(n) && n > 0)

  const taxaMin = num(f.taxaMin) / 100
  const taxas = lista(f.taxas).map((t) => t / 100).sort((a, b) => a - b)
  const prazos = lista(f.prazos).map(Math.round).sort((a, b) => a - b)
  const ltvHe = num(f.ltvHe) / 100
  const ltvFin = num(f.ltvFin) / 100
  const ufs = f.ufs.toUpperCase().split(/[\s,;]+/).filter((u) => /^[A-Z]{2}$/.test(u))

  if (!(taxaMin > 0.001 && taxaMin < 0.1)) return { ok: false, mensagem: 'Taxa mínima inválida (informe em %, por exemplo 1,19).' }
  if (!taxas.length || taxas.some((t) => t < taxaMin - 1e-9 || t > 0.1)) return { ok: false, mensagem: 'As opções de taxa devem ser iguais ou maiores que a mínima.' }
  if (!(ltvHe > 0 && ltvHe <= 0.9) || !(ltvFin > 0 && ltvFin <= 0.9)) return { ok: false, mensagem: 'Percentual do imóvel inválido (entre 1 e 90).' }
  if (!prazos.length || prazos.some((p) => p < 12 || p > 420)) return { ok: false, mensagem: 'Prazos inválidos (entre 12 e 420 meses).' }
  if (!ufs.length) return { ok: false, mensagem: 'Informe ao menos um estado atendido.' }

  const db = admin()
  const { data: atual } = await db.from('configuracoes').select('valor').eq('chave', 'simulador').maybeSingle()
  const base = (atual?.valor ?? {}) as Record<string, unknown>
  const valor = { ...base, taxa_min: taxaMin, taxas, prazos, ltv: { home_equity: ltvHe, financiamento: ltvFin } }
  const agora = new Date().toISOString()
  const r1 = await db.from('configuracoes').upsert({ chave: 'simulador', valor, updated_by: uid, updated_at: agora })
  const r2 = await db.from('configuracoes').upsert({ chave: 'regioes', valor: { ufs }, updated_by: uid, updated_at: agora })
  if (r1.error || r2.error) return { ok: false, mensagem: 'Não foi possível salvar.' }
  for (const p of ['/', '/credito-com-garantia-de-imovel', '/financiamento-imobiliario', '/portabilidade-de-financiamento']) revalidatePath(p)
  return { ok: true, mensagem: 'Salvo. O site usa os novos valores em até 5 minutos.' }
}

export async function salvarAgente(f: { ativoGlobal: boolean; maxMsgs: string; atrasoMin: string; atrasoMax: string; base: string }): Promise<Ret> {
  const uid = await exigirGestor()
  if (!uid) return NEGADO
  const max = Math.round(Number(f.maxMsgs))
  const a = Number(f.atrasoMin)
  const b = Number(f.atrasoMax)
  if (!(max >= 3 && max <= 60)) return { ok: false, mensagem: 'O limite de mensagens deve ficar entre 3 e 60.' }
  if (!(a >= 1 && b >= a && b <= 60)) return { ok: false, mensagem: 'O atraso deve ficar entre 1 e 60 segundos, com o mínimo menor que o máximo.' }
  if (f.base.length > 8000) return { ok: false, mensagem: 'A base de conhecimento passou de 8000 caracteres.' }
  const db = admin()
  const { data: atual } = await db.from('configuracoes').select('valor').eq('chave', 'agente').maybeSingle()
  const valor = { ...((atual?.valor ?? {}) as Record<string, unknown>), ativo_global: f.ativoGlobal, max_msgs_antes_humano: max, atraso_seg: [a, b] }
  const agora = new Date().toISOString()
  const r1 = await db.from('configuracoes').upsert({ chave: 'agente', valor, updated_by: uid, updated_at: agora })
  const r2 = await db.from('configuracoes').upsert({ chave: 'agente_base', valor: { texto: f.base }, updated_by: uid, updated_at: agora })
  if (r1.error || r2.error) return { ok: false, mensagem: 'Não foi possível salvar.' }
  revalidatePath('/painel/agente')
  return { ok: true, mensagem: f.ativoGlobal ? 'Salvo. O agente de IA está LIGADO.' : 'Salvo. O agente de IA está desligado.' }
}

export async function alternarAgenteNumero(instanciaId: string, ativo: boolean): Promise<Ret> {
  if (!(await exigirGestor())) return NEGADO
  if (!UUID.test(instanciaId)) return { ok: false, mensagem: 'Número inválido.' }
  const { error } = await admin().from('instancias').update({ agente_ativo: ativo }).eq('id', instanciaId)
  if (error) return { ok: false, mensagem: 'Não foi possível salvar.' }
  revalidatePath('/painel/agente')
  return { ok: true, mensagem: ativo ? 'Agente ligado neste número.' : 'Agente desligado neste número.' }
}

export async function cadastrarNumero(f: { usuarioId: string; instancia: string; token: string; numero: string }): Promise<Ret> {
  if (!(await exigirGestor())) return NEGADO
  const e164 = paraE164(f.numero)
  if (!e164) return { ok: false, mensagem: 'Número de WhatsApp inválido.' }
  if (!UUID.test(f.usuarioId) || !/^[A-Za-z0-9_-]{2,60}$/.test(f.instancia) || f.token.trim().length < 8) {
    return { ok: false, mensagem: 'Confira o vendedor, o nome da instância e o token.' }
  }
  const db = admin()
  const { data, error } = await db
    .from('instancias')
    .upsert({ usuario_id: f.usuarioId, uazapi_instance: f.instancia, numero_e164: e164 }, { onConflict: 'uazapi_instance' })
    .select('id')
    .single()
  if (error || !data) return { ok: false, mensagem: 'Não foi possível salvar o número.' }
  const { error: errTok } = await db.rpc('set_instancia_token', { p_instancia: data.id, p_token: f.token.trim() })
  if (errTok) return { ok: false, mensagem: 'O número foi salvo, mas o token não. Tente de novo.' }
  revalidatePath('/painel/conexoes')
  return { ok: true, mensagem: 'Número cadastrado. Agora aponte o webhook da UAZAPI para o endereço mostrado abaixo.' }
}

export async function criarUsuario(f: { nome: string; email: string; senha: string; papel: string; whatsapp: string }): Promise<Ret> {
  if (!(await exigirGestor())) return NEGADO
  const nome = f.nome.trim()
  const email = f.email.trim().toLowerCase()
  if (nome.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, mensagem: 'Confira o nome e o e-mail.' }
  if (f.senha.length < 10) return { ok: false, mensagem: 'A senha temporária precisa ter ao menos 10 caracteres.' }
  if (!['vendedor', 'gestor'].includes(f.papel)) return { ok: false, mensagem: 'Papel inválido.' }
  const alerta = f.whatsapp.trim() ? paraE164(f.whatsapp) : null
  if (f.whatsapp.trim() && !alerta) return { ok: false, mensagem: 'WhatsApp para alertas inválido.' }

  const db = admin()
  const { data, error } = await db.auth.admin.createUser({ email, password: f.senha, email_confirm: true })
  if (error || !data.user) {
    return { ok: false, mensagem: error?.message.includes('already') ? 'Já existe um usuário com este e-mail.' : 'Não foi possível criar o usuário.' }
  }
  const { error: errU } = await db.from('usuarios').insert({ id: data.user.id, nome, email, papel: f.papel, whatsapp_alerta: alerta })
  if (errU) {
    await db.auth.admin.deleteUser(data.user.id)
    return { ok: false, mensagem: 'Não foi possível salvar o usuário.' }
  }
  revalidatePath('/painel/equipe')
  return { ok: true, mensagem: 'Usuário criado. Passe a senha temporária por um canal seguro e peça para trocar no primeiro acesso.' }
}
