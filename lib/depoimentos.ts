import 'server-only'
import { admin } from '@/lib/supabase/admin'

export interface Depoimento {
  id: string
  nome: string
  cidade: string | null
  uf: string | null
  texto: string
  nota: number | null
  fonte: string | null
}

/** Só aparecem depoimentos publicados, e a tabela só aceita depoimento com a data de autorização do cliente. */
export async function depoimentosPublicados(limite = 6): Promise<Depoimento[]> {
  try {
    const { data } = await admin()
      .from('depoimentos')
      .select('id, nome, cidade, uf, texto, nota, fonte')
      .eq('publicado', true)
      .order('ordem')
      .order('created_at', { ascending: false })
      .limit(limite)
    return (data ?? []) as Depoimento[]
  } catch {
    return []
  }
}
