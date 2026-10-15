import { NextResponse, type NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { parseEvento } from '@/lib/whatsapp/uazapi'
import { processarMensagem } from '@/lib/whatsapp/processar'

function segredoValido(recebido: string | null): boolean {
  const esperado = process.env.UAZAPI_WEBHOOK_SECRET
  if (!esperado || !recebido) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/webhooks/uazapi/[instancia]'>) {
  if (!segredoValido(req.nextUrl.searchParams.get('t'))) return new NextResponse(null, { status: 401 })
  const { instancia } = await ctx.params

  try {
    const evento = parseEvento(await req.json().catch(() => null))

    if (evento.tipo === 'conexao') {
      await admin()
        .from('instancias')
        .update({ status: evento.conectada ? 'conectada' : 'desconectada', ultimo_evento_em: new Date().toISOString() })
        .eq('uazapi_instance', instancia)
      return NextResponse.json({ ok: true })
    }

    if (evento.tipo === 'mensagem') {
      const r = await processarMensagem(instancia, evento.mensagem)
      return NextResponse.json(r)
    }
    return NextResponse.json({ ok: true, acao: 'ignorado' })
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('webhook uazapi', e)
    // 500 faz a UAZAPI tentar de novo; a gravação é idempotente
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
