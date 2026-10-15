import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { sessaoDoCliente } from '@/lib/documentos/sessao-http'
import { limitar } from '@/lib/rate-limit'

const EXTENSAO: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}
const corpo = z.object({
  tipo: z.string().regex(/^[a-z_]{2,30}$/),
  mime: z.string(),
  tamanho: z.number().int().positive().max(10 * 1024 * 1024),
})

export async function POST(req: Request) {
  const sessao = await sessaoDoCliente()
  if (!sessao) return NextResponse.json({ erro: 'sessao_expirada' }, { status: 401 })
  if (!limitar('up:' + sessao.lid, 60, 60 * 60_000)) return NextResponse.json({ erro: 'muitas_tentativas' }, { status: 429 })
  const p = corpo.safeParse(await req.json().catch(() => null))
  if (!p.success || !EXTENSAO[p.data.mime]) return NextResponse.json({ erro: 'arquivo_invalido' }, { status: 400 })

  try {
    const db = admin()
    const { data: tipo } = await db.from('documento_tipos').select('id').eq('chave', p.data.tipo).eq('ativo', true).maybeSingle()
    if (!tipo) return NextResponse.json({ erro: 'tipo_invalido' }, { status: 400 })
    const { data: item } = await db.from('documento_itens').select('id, status').eq('lead_id', sessao.lid).eq('tipo_id', tipo.id).maybeSingle()
    if (!item) return NextResponse.json({ erro: 'item_nao_liberado' }, { status: 403 })
    if (item.status === 'aprovado') return NextResponse.json({ erro: 'item_ja_aprovado' }, { status: 409 })

    const caminho = sessao.lid + '/' + p.data.tipo + '/' + randomUUID() + '.' + EXTENSAO[p.data.mime]
    const { data, error } = await db.storage.from('documentos').createSignedUploadUrl(caminho)
    if (error || !data) throw error ?? new Error('sem URL de upload')
    return NextResponse.json({ path: caminho, token: data.token })
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('POST /api/documentos/upload-url', e)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
