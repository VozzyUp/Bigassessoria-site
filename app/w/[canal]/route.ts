import { NextResponse, type NextRequest } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { hashIp, ipDe } from '@/lib/hash'
import { paraWaMe } from '@/lib/telefone'

// Link rastreável: /w/instagram, /w/google-meu-negocio, /w/parceiro-zaff ...
// Registra o clique e abre o WhatsApp com a mensagem marcada daquele canal.
export async function GET(req: NextRequest, ctx: RouteContext<'/w/[canal]'>) {
  const { canal: slug } = await ctx.params
  const site = new URL('/', req.url)
  try {
    const db = admin()
    const { data: canal } = await db
      .from('canais')
      .select('id, mensagem, marcador, usuario_id')
      .eq('slug', slug)
      .eq('ativo', true)
      .maybeSingle()
    if (!canal) return NextResponse.redirect(site)

    const q = req.nextUrl.searchParams
    const utm: Record<string, string> = {}
    q.forEach((v, k) => {
      if (k.startsWith('utm_')) utm[k] = v.slice(0, 200)
    })
    await db.from('cliques').insert({
      canal_id: canal.id,
      gclid: q.get('gclid'),
      gbraid: q.get('gbraid'),
      wbraid: q.get('wbraid'),
      fbclid: q.get('fbclid'),
      fbp: req.cookies.get('_fbp')?.value ?? null,
      fbc: req.cookies.get('_fbc')?.value ?? null,
      utm,
      landing_page: req.nextUrl.pathname,
      user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
      ip_hash: hashIp(ipDe(req)),
    })

    const numeroDe = async (usuarioId: string | null) => {
      if (!usuarioId) return null
      const { data } = await db
        .from('instancias')
        .select('numero_e164')
        .eq('usuario_id', usuarioId)
        .eq('status', 'conectada')
        .limit(1)
        .maybeSingle()
      return (data?.numero_e164 as string | null) ?? null
    }

    let destino = await numeroDe(canal.usuario_id)
    if (!destino) {
      const { data: v } = await db.rpc('proximo_vendedor')
      destino = await numeroDe((v as string | null) ?? null)
    }
    if (!destino && process.env.WHATSAPP_PUBLICO) destino = '+' + process.env.WHATSAPP_PUBLICO.replace(/\D/g, '')
    if (!destino) return NextResponse.redirect(site)

    const texto = (canal.mensagem + ' ' + canal.marcador).trim()
    return NextResponse.redirect('https://wa.me/' + paraWaMe(destino) + '?text=' + encodeURIComponent(texto))
  } catch (e) {
    console.error('GET /w', e)
    return NextResponse.redirect(site)
  }
}
