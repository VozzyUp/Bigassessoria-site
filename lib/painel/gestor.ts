import 'server-only'
import { supabaseDoUsuario } from '@/lib/supabase/server'

/** Só o gestor ativo passa. Devolve o id do usuário ou null. Fica fora dos arquivos "use server" para não virar ação pública. */
export async function exigirGestor(): Promise<string | null> {
  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase.from('usuarios').select('papel, ativo').eq('id', auth.user.id).maybeSingle()
  return data?.papel === 'gestor' && data.ativo ? auth.user.id : null
}
