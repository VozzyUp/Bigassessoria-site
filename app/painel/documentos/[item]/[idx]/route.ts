import { NextResponse, type NextRequest } from 'next/server'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'

// Abre um documento do cliente por URL assinada de 60 segundos, depois de checar o acesso (RLS) e registrar na auditoria.
export async function GET(_req: NextRequest, ctx: RouteContext<'/painel/documentos/[item]/[idx]'>) {
  const { item, idx } = await ctx.params
  if (!/^[0-9a-f-]{36}$/.test(item) || !/^\d{1,2}$/.test(idx)) return new NextResponse('Não encontrado', { status: 404 })

  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return new NextResponse('Não autorizado', { status: 401 })

  const { data: doc } = await supabase.from('documento_itens').select('lead_id, arquivos').eq('id', item).maybeSingle()
  const caminho = doc?.arquivos?.[Number(idx)]
  if (!doc || !caminho) return new NextResponse('Não encontrado', { status: 404 })

  const db = admin()
  const { data, error } = await db.storage.from('documentos').createSignedUrl(caminho, 60)
  if (error || !data) return new NextResponse('Arquivo indisponível', { status: 502 })
  await db.from('audit_log').insert({ lead_id: doc.lead_id, ator: 'usuario', usuario_id: auth.user.id, acao: 'doc.download', detalhes: { item } })
  return NextResponse.redirect(data.signedUrl)
}
