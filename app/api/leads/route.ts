import { NextResponse } from 'next/server'
import { z } from 'zod'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { lerConfigSimulador, lerUfsAtendidas } from '@/lib/config'
import { formatarBRL, simular } from '@/lib/financeiro'
import { paraE164, paraWaMe } from '@/lib/telefone'
import { atribuicaoSchema } from '@/lib/atribuicao/tipos'
import { limitar } from '@/lib/rate-limit'

const corpo = z.object({
  nome: z.string().trim().min(2).max(120),
  whatsapp: z.string().max(40),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  consentimento: z.literal(true),
  marketing: z.boolean().optional(),
  consentimentoAnuncios: z.boolean().optional(),
  uf: z.string().length(2).optional(),
  cidade: z.string().max(120).optional(),
  finalidade: z.string().max(60).optional(),
  urgencia: z.enum(['30d', '1-3m', '3-6m', 'planejando']).optional(),
  situacaoImovel: z.enum(['quitado', 'financiado']).optional(),
  simulacao: z.object({
    produto: z.enum(['home_equity', 'financiamento', 'portabilidade']),
    valorImovelCentavos: z.number().int().positive(),
    valorCreditoCentavos: z.number().int().positive(),
    taxaMensal: z.number().positive(),
    prazoMeses: z.number().int().min(12).max(420),
    carenciaDias: z.union([z.literal(30), z.literal(60), z.literal(90)]),
    sistema: z.enum(['price', 'sac']),
  }),
  atribuicao: atribuicaoSchema.optional(),
})

const ROTULO = {
  home_equity: 'crédito com garantia de imóvel',
  financiamento: 'financiamento imobiliário',
  portabilidade: 'portabilidade',
} as const

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!limitar('lead:' + ip, 8, 10 * 60_000)) {
    return NextResponse.json({ erro: 'muitas_tentativas' }, { status: 429 })
  }

  const parsed = corpo.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ erro: 'dados_invalidos', campos: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const d = parsed.data

  const e164 = paraE164(d.whatsapp)
  if (!e164) return NextResponse.json({ erro: 'whatsapp_invalido' }, { status: 400 })

  try {
    const [cfg, ufs] = await Promise.all([lerConfigSimulador(), lerUfsAtendidas()])

    // O servidor refaz a conta: o navegador nunca é a fonte da verdade.
    const s = d.simulacao
    const r = simular(s, cfg)
    if (r.erros.length) return NextResponse.json({ erro: 'simulacao_invalida', detalhes: r.erros }, { status: 422 })

    const db = admin()
    const a = d.atribuicao ?? {}
    const uf = d.uf?.toUpperCase()
    const foraRegiao = uf ? !ufs.includes(uf) : false
    const agora = new Date().toISOString()

    const { data: existente } = await db
      .from('leads')
      .select('id, usuario_id')
      .eq('whatsapp_e164', e164)
      .maybeSingle()

    let vendedorId: string | null = existente?.usuario_id ?? null
    if (!vendedorId) {
      const { data: v } = await db.rpc('proximo_vendedor')
      vendedorId = (v as string | null) ?? null
    }

    const ultimoToque = { utm: a.utm ?? {}, gclid: a.gclid, fbclid: a.fbclid, landing: a.landing, em: agora }
    const campos = {
      nome: d.nome,
      email: d.email || null,
      uf: uf ?? null,
      cidade: d.cidade ?? null,
      fora_regiao: foraRegiao,
      produto: s.produto,
      usuario_id: vendedorId,
      gclid: a.gclid ?? null,
      gbraid: a.gbraid ?? null,
      wbraid: a.wbraid ?? null,
      fbp: a.fbp ?? null,
      fbc: a.fbc ?? null,
      visitante_id: a.visitanteId ?? null,
      ultimo_toque: ultimoToque,
      consentimento_lgpd_em: agora,
      consentimento_marketing: d.marketing ?? false,
      consentimento_anuncios: d.consentimentoAnuncios ?? false,
      ultimo_contato_em: agora,
    }

    let leadId: string
    if (existente) {
      const { error } = await db.from('leads').update(campos).eq('id', existente.id)
      if (error) throw error
      leadId = existente.id
    } else {
      const { data, error } = await db
        .from('leads')
        .insert({ ...campos, whatsapp_e164: e164, primeiro_toque: a.primeiroToque ?? ultimoToque })
        .select('id')
        .single()
      if (error) throw error
      leadId = data.id
    }

    // Conversão "Lead" para o Google e a Meta (o job envia só se houver consentimento para anúncios)
    await db.from('conversoes_enviadas').upsert(
      ['google_ads', 'meta'].map((plataforma) => ({ lead_id: leadId, plataforma, evento: 'Lead', event_id: leadId + ':Lead' })),
      { onConflict: 'lead_id,plataforma,evento', ignoreDuplicates: true },
    )

    const { error: errSim } = await db.from('simulacoes').insert({
      lead_id: leadId,
      visitante_id: a.visitanteId ?? null,
      produto: s.produto,
      valor_imovel_centavos: s.valorImovelCentavos,
      valor_credito_centavos: s.valorCreditoCentavos,
      prazo_meses: s.prazoMeses,
      carencia_dias: s.carenciaDias,
      finalidade: d.finalidade ?? null,
      urgencia: d.urgencia ?? null,
      situacao_imovel: d.situacaoImovel ?? null,
      taxa_mensal: s.taxaMensal,
      indexador: cfg.indexador,
      sistema: s.sistema,
      parcela_centavos: r.parcelaCentavos,
      ultima_parcela_centavos: r.ultimaParcelaCentavos,
      ltv: Number(r.ltv.toFixed(4)),
      uf: uf ?? null,
      cidade: d.cidade ?? null,
      origem: 'site',
    })
    if (errSim) throw errSim

    // Para qual número o cliente fala: o do vendedor responsável, ou o número público de reserva.
    let destino: string | null = null
    if (vendedorId) {
      const { data: inst } = await db
        .from('instancias')
        .select('numero_e164')
        .eq('usuario_id', vendedorId)
        .eq('status', 'conectada')
        .limit(1)
        .maybeSingle()
      destino = inst?.numero_e164 ?? null
    }
    if (!destino && process.env.WHATSAPP_PUBLICO) destino = '+' + process.env.WHATSAPP_PUBLICO.replace(/\D/g, '')

    const primeiroNome = d.nome.split(' ')[0]
    const texto =
      'Olá! Sou ' + primeiroNome + '. Fiz uma simulação de ' + ROTULO[s.produto] + ' de ' +
      formatarBRL(s.valorCreditoCentavos) + ' em ' + s.prazoMeses + 'x no site da Big Assessoria e quero seguir com os bancos.'
    const whatsappUrl = destino ? 'https://wa.me/' + paraWaMe(destino) + '?text=' + encodeURIComponent(texto) : null

    return NextResponse.json({ ok: true, leadId, foraRegiao, whatsappUrl })
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('POST /api/leads', e)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
