import { NextResponse } from 'next/server'
import { z } from 'zod'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { paraE164 } from '@/lib/telefone'
import { limitar } from '@/lib/rate-limit'
import { hashIp, ipDe } from '@/lib/hash'
import { assinarSessao, COOKIE_SESSAO, hashCodigo, iguais, MAX_TENTATIVAS } from '@/lib/documentos/seguranca'
import { leadPorTelefone } from '@/lib/documentos/liberar'

const corpo = z.object({ whatsapp: z.string().max(40), codigo: z.string().regex(/^\d{6}$/) })

// Resposta única para qualquer falha: não revela se o número existe nem se o código venceu.
const NEGADO = NextResponse.json({ erro: 'codigo_invalido' }, { status: 401 })

export async function POST(req: Request) {
  const ip = ipDe(req) ?? 'local'
  if (!limitar('doc-ip:' + ip, 20, 10 * 60_000)) return NextResponse.json({ erro: 'muitas_tentativas' }, { status: 429 })

  const p = corpo.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ erro: 'dados_invalidos' }, { status: 400 })
  const e164 = paraE164(p.data.whatsapp)
  if (!e164) return NEGADO.clone()
  if (!limitar('doc-tel:' + e164, 12, 60 * 60_000)) return NextResponse.json({ erro: 'muitas_tentativas' }, { status: 429 })

  try {
    const db = admin()
    const lead = await leadPorTelefone(e164)
    if (!lead) return NEGADO.clone()

    const { data: cod } = await db
      .from('codigos_acesso')
      .select('id, whatsapp_e164, codigo_hash, expira_em, tentativas')
      .eq('lead_id', lead.id)
      .is('usado_em', null)
      .is('revogado_em', null)
      .maybeSingle()
    if (!cod || new Date(cod.expira_em).getTime() < Date.now() || cod.tentativas >= MAX_TENTATIVAS) return NEGADO.clone()

    const confere = iguais(cod.codigo_hash, hashCodigo(cod.whatsapp_e164, p.data.codigo))
    if (!confere) {
      const tentativas = cod.tentativas + 1
      await db
        .from('codigos_acesso')
        .update({ tentativas, ...(tentativas >= MAX_TENTATIVAS ? { revogado_em: new Date().toISOString() } : {}) })
        .eq('id', cod.id)
      await db.from('audit_log').insert({ lead_id: lead.id, ator: 'cliente', acao: tentativas >= MAX_TENTATIVAS ? 'codigo.bloqueado' : 'codigo.falhou', ip_hash: hashIp(ip) })
      return NEGADO.clone()
    }

    await db.from('codigos_acesso').update({ usado_em: new Date().toISOString() }).eq('id', cod.id)
    await db.from('audit_log').insert({ lead_id: lead.id, ator: 'cliente', acao: 'codigo.aceito', ip_hash: hashIp(ip) })

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_SESSAO, assinarSessao(lead.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60 * 60,
    })
    return res
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('POST /api/documentos/entrar', e)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
