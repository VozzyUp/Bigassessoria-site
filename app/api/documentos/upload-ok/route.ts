import { NextResponse } from 'next/server'
import { z } from 'zod'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { sessaoDoCliente } from '@/lib/documentos/sessao-http'

const corpo = z.object({ tipo: z.string().regex(/^[a-z_]{2,30}$/), path: z.string().max(300) })

export async function POST(req: Request) {
  const sessao = await sessaoDoCliente()
  if (!sessao) return NextResponse.json({ erro: 'sessao_expirada' }, { status: 401 })
  const p = corpo.safeParse(await req.json().catch(() => null))
  // o arquivo precisa estar na pasta do próprio lead e do tipo informado
  if (!p.success || !p.data.path.startsWith(sessao.lid + '/' + p.data.tipo + '/') || p.data.path.includes('..')) {
    return NextResponse.json({ erro: 'dados_invalidos' }, { status: 400 })
  }
  try {
    const db = admin()
    const { data: existe } = await db.storage.from('documentos').exists(p.data.path)
    if (!existe) return NextResponse.json({ erro: 'arquivo_nao_encontrado' }, { status: 404 })

    const { data: tipo } = await db.from('documento_tipos').select('id').eq('chave', p.data.tipo).maybeSingle()
    if (!tipo) return NextResponse.json({ erro: 'tipo_invalido' }, { status: 400 })
    const { data: item } = await db.from('documento_itens').select('id, arquivos, status').eq('lead_id', sessao.lid).eq('tipo_id', tipo.id).maybeSingle()
    if (!item || item.status === 'aprovado') return NextResponse.json({ erro: 'item_indisponivel' }, { status: 409 })

    const arquivos = Array.from(new Set([...(item.arquivos ?? []), p.data.path]))
    await db.from('documento_itens').update({ arquivos, status: 'enviado', enviado_em: new Date().toISOString(), motivo_rejeicao: null }).eq('id', item.id)
    await db.from('audit_log').insert({ lead_id: sessao.lid, ator: 'cliente', acao: 'doc.upload', detalhes: { tipo: p.data.tipo } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('POST /api/documentos/upload-ok', e)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
