import { NextResponse } from 'next/server'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { sessaoDoCliente } from '@/lib/documentos/sessao-http'
import { enviarSemRegistro } from '@/lib/whatsapp/enviar'

type Tipo = { nome: string; obrigatorio: boolean; so_se_financiado: boolean } | null

export async function POST() {
  const sessao = await sessaoDoCliente()
  if (!sessao) return NextResponse.json({ erro: 'sessao_expirada' }, { status: 401 })
  try {
    const db = admin()
    const { data: itens } = await db.from('documento_itens').select('status, documento_tipos(nome, obrigatorio, so_se_financiado)').eq('lead_id', sessao.lid)
    const faltando = (itens ?? [])
      .map((i) => ({ status: i.status as string, tipo: (Array.isArray(i.documento_tipos) ? i.documento_tipos[0] : i.documento_tipos) as Tipo }))
      .filter((i) => i.tipo?.obrigatorio && !i.tipo.so_se_financiado && i.status === 'pendente')
      .map((i) => i.tipo!.nome)
    if (faltando.length) return NextResponse.json({ erro: 'faltam_documentos', faltando }, { status: 422 })

    const { data: dados } = await db.from('dados_cadastrais').select('lead_id').eq('lead_id', sessao.lid).maybeSingle()
    if (!dados) return NextResponse.json({ erro: 'faltam_dados' }, { status: 422 })

    await db.from('audit_log').insert({ lead_id: sessao.lid, ator: 'cliente', acao: 'docs.concluido' })

    // avisa o vendedor responsável
    const { data: lead } = await db.from('leads').select('nome, usuario_id').eq('id', sessao.lid).maybeSingle()
    if (lead?.usuario_id) {
      const [{ data: u }, { data: inst }] = await Promise.all([
        db.from('usuarios').select('whatsapp_alerta').eq('id', lead.usuario_id).maybeSingle(),
        db.from('instancias').select('id').eq('usuario_id', lead.usuario_id).eq('status', 'conectada').limit(1).maybeSingle(),
      ])
      if (u?.whatsapp_alerta && inst) {
        await enviarSemRegistro(inst.id, u.whatsapp_alerta, (lead.nome ?? 'Um cliente') + ' concluiu o envio dos documentos. Revise no painel.').catch((e) =>
          console.error('aviso de documentos', e),
        )
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('POST /api/documentos/concluir', e)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
