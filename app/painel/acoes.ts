'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { ETAPAS, MOTIVOS_PERDA } from '@/lib/funil'

export async function sair() {
  const supabase = await supabaseDoUsuario()
  await supabase.auth.signOut()
  redirect('/painel/login')
}

/**
 * Muda a etapa do lead. Roda como o usuário logado, então o RLS decide se ele pode mexer neste lead.
 * A mudança manual trava a IA: a classificação automática não sobrescreve mais a etapa.
 */
export async function moverEtapa(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const etapa = String(formData.get('etapa') ?? '')
  const motivo = String(formData.get('motivo') ?? '')
  if (!/^[0-9a-f-]{36}$/.test(id)) return
  if (!ETAPAS.some((e) => e.id === etapa)) return

  const patch: Record<string, unknown> = { etapa, etapa_travada_humano: true }
  if (etapa === 'perdido') {
    if (!MOTIVOS_PERDA.some((m) => m.id === motivo)) redirect('/painel/funil?erro=motivo')
    patch.motivo_perda = motivo
  } else {
    patch.motivo_perda = null
  }

  const supabase = await supabaseDoUsuario()
  const { error } = await supabase.from('leads').update(patch).eq('id', id)
  if (error) redirect('/painel/funil?erro=falha')
  revalidatePath('/painel/funil')
  revalidatePath('/painel/leads/' + id)
}
