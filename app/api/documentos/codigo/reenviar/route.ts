import { NextResponse } from 'next/server'
import { z } from 'zod'
import { admin } from '@/lib/supabase/admin'
import { paraE164 } from '@/lib/telefone'
import { limitar } from '@/lib/rate-limit'
import { ipDe } from '@/lib/hash'
import { enviarCodigo, leadPorTelefone } from '@/lib/documentos/liberar'

const corpo = z.object({ whatsapp: z.string().max(40) })

// Sempre responde ok: quem consulta não descobre se o número está cadastrado.
export async function POST(req: Request) {
  const ip = ipDe(req) ?? 'local'
  if (!limitar('reenvio-ip:' + ip, 10, 60 * 60_000)) return NextResponse.json({ erro: 'muitas_tentativas' }, { status: 429 })
  const p = corpo.safeParse(await req.json().catch(() => null))
  const e164 = p.success ? paraE164(p.data.whatsapp) : null
  if (!e164) return NextResponse.json({ ok: true })
  if (!limitar('reenvio-tel:' + e164, 3, 60 * 60_000)) return NextResponse.json({ ok: true })

  try {
    const lead = await leadPorTelefone(e164)
    if (lead) {
      // só reenvia para quem já teve os documentos liberados (existe checklist)
      const { count } = await admin().from('documento_itens').select('id', { head: true, count: 'exact' }).eq('lead_id', lead.id)
      if ((count ?? 0) > 0) await enviarCodigo(lead.id, null)
    }
  } catch (e) {
    console.error('reenviar código', e)
  }
  return NextResponse.json({ ok: true })
}
