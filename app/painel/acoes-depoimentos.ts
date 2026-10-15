'use server'

import { revalidatePath } from 'next/cache'
import { admin } from '@/lib/supabase/admin'
import { exigirGestor } from '@/lib/painel/gestor'

type Ret = { ok: boolean; mensagem: string }

function atualizarSite() {
  for (const p of ['/', '/credito-com-garantia-de-imovel', '/financiamento-imobiliario', '/portabilidade-de-financiamento', '/painel/depoimentos']) revalidatePath(p)
}

export async function criarDepoimento(f: { nome: string; cidade: string; uf: string; texto: string; nota: string; fonte: string; autorizado: boolean }): Promise<Ret> {
  if (!(await exigirGestor())) return { ok: false, mensagem: 'Só o gestor pode fazer isso.' }
  if (!f.autorizado) return { ok: false, mensagem: 'Só publique com a autorização do cliente. Marque a caixa depois de ter o aval dele.' }
  const nome = f.nome.trim()
  const texto = f.texto.trim()
  if (nome.length < 2 || texto.length < 20) return { ok: false, mensagem: 'Informe o nome e o depoimento (mínimo 20 caracteres).' }
  if (texto.length > 600) return { ok: false, mensagem: 'O depoimento passou de 600 caracteres.' }
  const nota = f.nota ? Number(f.nota) : null
  if (nota !== null && !(Number.isInteger(nota) && nota >= 1 && nota <= 5)) return { ok: false, mensagem: 'Nota inválida.' }
  const fonte = ['google', 'whatsapp', 'outro'].includes(f.fonte) ? f.fonte : 'outro'
  const uf = f.uf.trim().toUpperCase()
  const { error } = await admin().from('depoimentos').insert({
    nome,
    cidade: f.cidade.trim() || null,
    uf: /^[A-Z]{2}$/.test(uf) ? uf : null,
    texto,
    nota,
    fonte,
    autorizacao_em: new Date().toISOString(),
    publicado: false,
  })
  if (error) return { ok: false, mensagem: 'Não foi possível salvar.' }
  atualizarSite()
  return { ok: true, mensagem: 'Depoimento salvo como rascunho. Publique quando quiser.' }
}

export async function publicarDepoimento(id: string, publicado: boolean): Promise<Ret> {
  if (!(await exigirGestor())) return { ok: false, mensagem: 'Só o gestor pode fazer isso.' }
  if (!/^[0-9a-f-]{36}$/.test(id)) return { ok: false, mensagem: 'Depoimento inválido.' }
  const { error } = await admin().from('depoimentos').update({ publicado }).eq('id', id)
  if (error) return { ok: false, mensagem: 'Não foi possível salvar.' }
  atualizarSite()
  return { ok: true, mensagem: publicado ? 'Publicado no site (em até 5 minutos).' : 'Removido do site.' }
}

export async function excluirDepoimento(id: string): Promise<Ret> {
  if (!(await exigirGestor())) return { ok: false, mensagem: 'Só o gestor pode fazer isso.' }
  if (!/^[0-9a-f-]{36}$/.test(id)) return { ok: false, mensagem: 'Depoimento inválido.' }
  const { error } = await admin().from('depoimentos').delete().eq('id', id)
  if (error) return { ok: false, mensagem: 'Não foi possível excluir.' }
  atualizarSite()
  return { ok: true, mensagem: 'Depoimento excluído.' }
}
