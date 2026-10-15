import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { admin } from '@/lib/supabase/admin'
import { lerConfig, lerConfigSimulador, lerUfsAtendidas } from '@/lib/config'
import { formatarBRL, formatarPercentual, simular } from '@/lib/financeiro'
import { enviarAoLead, enviarSemRegistro } from '@/lib/whatsapp/enviar'
import { mascarar } from '@/lib/telefone'
import { atrasoHumano, dentroDoHorario, deveResponder, HORARIO_PADRAO, limparResposta, violaRegras, type Horario } from './regras'
import { BASE_PADRAO, FERRAMENTAS, promptSistema } from './prompt'

interface ConfigAgente {
  ativo_global: boolean
  max_msgs_antes_humano: number
  atraso_seg: [number, number]
  modelo_conversa: string
}
const CONFIG_PADRAO_AGENTE: ConfigAgente = { ativo_global: false, max_msgs_antes_humano: 12, atraso_seg: [4, 12], modelo_conversa: 'claude-sonnet-5-5' }

type Msg = { direcao: string; enviado_por: string; texto: string | null; transcricao: string | null; enviado_em: string }
type Bloco = Anthropic.Messages.ContentBlockParam
type Mensagem = Anthropic.Messages.MessageParam
type ConfigSim = Awaited<ReturnType<typeof lerConfigSimulador>>
type LeadResumo = { id: string; nome: string | null; whatsapp_e164: string; etapa: string; usuario_id: string | null; etapa_travada_humano: boolean }

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Converte o histórico em turnos alternados user/assistant (a API exige alternância e começar por user). */
export function paraTurnos(msgs: Msg[]): Mensagem[] {
  const turnos: Mensagem[] = []
  for (const m of msgs) {
    const texto = (m.texto ?? m.transcricao ?? '').trim()
    if (!texto) continue
    const role = m.direcao === 'entrada' ? 'user' : 'assistant'
    const ultimo = turnos[turnos.length - 1]
    if (ultimo && ultimo.role === role) ultimo.content = String(ultimo.content) + '\n' + texto
    else turnos.push({ role, content: texto })
  }
  while (turnos.length && turnos[0].role !== 'user') turnos.shift()
  return turnos
}

export async function responderConversa(conversaId: string, gatilhoEm: number): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return
  const db = admin()

  const { data: conversa } = await db
    .from('conversas')
    .select('id, lead_id, agente_ativo, agente_msgs_enviadas, instancias(agente_ativo, usuario_id), leads(id, nome, uf, cidade, etapa, usuario_id, whatsapp_e164, etapa_travada_humano, produto)')
    .eq('id', conversaId)
    .maybeSingle()
  if (!conversa) return
  const inst = Array.isArray(conversa.instancias) ? conversa.instancias[0] : conversa.instancias
  const leadBruto = Array.isArray(conversa.leads) ? conversa.leads[0] : conversa.leads
  if (!inst || !leadBruto) return
  const lead = leadBruto as LeadResumo & { cidade: string | null; uf: string | null; produto: string | null }

  const [cfg, horario, base, cfgSim, ufs] = await Promise.all([
    lerConfig<ConfigAgente>('agente', CONFIG_PADRAO_AGENTE),
    lerConfig<Horario>('horario', HORARIO_PADRAO),
    lerConfig<{ texto: string }>('agente_base', { texto: BASE_PADRAO }),
    lerConfigSimulador(),
    lerUfsAtendidas(),
  ])

  const { data: hist } = await db
    .from('mensagens')
    .select('direcao, enviado_por, texto, transcricao, enviado_em')
    .eq('conversa_id', conversaId)
    .order('enviado_em', { ascending: false })
    .limit(30)
  const msgs = ((hist ?? []) as Msg[]).reverse()
  const ultimaDoCliente = [...msgs].reverse().find((m) => m.direcao === 'entrada')
  const fromMeRecente = msgs.some((m) => m.enviado_por === 'aparelho' && (!ultimaDoCliente || m.enviado_em > ultimaDoCliente.enviado_em))

  const decisao = deveResponder({
    globalAtivo: cfg.ativo_global,
    instanciaAtiva: !!inst.agente_ativo,
    conversaAtiva: !!conversa.agente_ativo,
    msgsEnviadas: conversa.agente_msgs_enviadas ?? 0,
    maxMsgs: cfg.max_msgs_antes_humano,
    fromMeRecente,
  })
  if (!decisao.responder) {
    if (decisao.motivo.startsWith('limite')) {
      await transferir(conversaId, lead, 'outro', 'O cliente atingiu o limite de mensagens do agente. Retome a conversa.')
    }
    return
  }

  const turnos = paraTurnos(msgs)
  if (!turnos.length || turnos[turnos.length - 1].role !== 'user') return

  const contexto = [
    'Nome do cliente: ' + (lead.nome ?? 'ainda não informado'),
    'Estado/cidade do imóvel: ' + ([lead.cidade, lead.uf].filter(Boolean).join('/') || 'ainda não informado'),
    'Produto de interesse: ' + (lead.produto ?? 'ainda não informado'),
    'Atendimento humano agora: ' + (dentroDoHorario(horario) ? 'sim, em horário comercial' : 'não. Fora do horário: diga que um especialista retorna no próximo dia útil.'),
    'Taxa mínima do site: ' + formatarPercentual(cfgSim.taxa_min) + ' a.m. + ' + cfgSim.indexador + '.',
  ].join('\n')

  const client = new Anthropic()
  const sistema = promptSistema(base.texto || BASE_PADRAO, contexto)
  const conversaClaude: Mensagem[] = [...turnos]
  let transferencia: { motivo: string; resumo: string } | null = null
  let resposta = ''
  let tokensIn = 0
  let tokensOut = 0
  const usadas: string[] = []

  for (let volta = 0; volta < 5; volta++) {
    const r = await client.messages.create({ model: cfg.modelo_conversa, max_tokens: 600, system: sistema, tools: FERRAMENTAS, messages: conversaClaude })
    tokensIn += r.usage.input_tokens
    tokensOut += r.usage.output_tokens
    const textos = r.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
    if (r.stop_reason !== 'tool_use') {
      resposta = textos
      break
    }
    conversaClaude.push({ role: 'assistant', content: r.content as Bloco[] })
    const resultados: Bloco[] = []
    for (const b of r.content) {
      if (b.type !== 'tool_use') continue
      usadas.push(b.name)
      const entrada = b.input as Record<string, unknown>
      let saida = 'ok'
      try {
        if (b.name === 'simular') saida = ferramentaSimular(entrada, cfgSim)
        else if (b.name === 'atualizar_dados_lead') saida = await ferramentaAtualizar(lead.id, entrada, ufs)
        else if (b.name === 'transferir_para_humano') {
          transferencia = { motivo: String(entrada.motivo ?? 'outro'), resumo: String(entrada.resumo ?? '').slice(0, 600) }
          saida = 'Transferência registrada. Despeça-se em uma frase curta e diga que o especialista continua a conversa.'
        }
      } catch (e) {
        saida = 'Erro ao executar: ' + (e instanceof Error ? e.message : String(e))
      }
      resultados.push({ type: 'tool_result', tool_use_id: b.id, content: saida })
    }
    conversaClaude.push({ role: 'user', content: resultados })
  }

  if (resposta) {
    const proibido = violaRegras(resposta)
    if (proibido) {
      console.warn('[agente] resposta bloqueada:', proibido)
      transferencia = transferencia ?? { motivo: 'outro', resumo: 'A resposta do agente foi bloqueada pelas regras de segurança (' + proibido + '). Assuma a conversa.' }
      resposta = ''
    }
  }

  let enviada = false
  if (resposta) {
    await dormir(atrasoHumano(cfg.atraso_seg))
    // depois da espera: alguém escreveu enquanto o agente "digitava"?
    const { data: novas } = await db.from('mensagens').select('id').eq('conversa_id', conversaId).gt('enviado_em', new Date(gatilhoEm).toISOString()).limit(1)
    const { data: estado } = await db.from('conversas').select('agente_ativo').eq('id', conversaId).maybeSingle()
    if (novas?.length || !estado?.agente_ativo) {
      await registrar(conversaId, null, usadas, null, cfg.modelo_conversa, tokensIn, tokensOut, 'cancelada: houve mensagem nova ou o agente foi pausado')
      return
    }
    await enviarAoLead({ conversaId, texto: limparResposta(resposta), enviadoPor: 'agente_ia' })
    await db.from('conversas').update({ agente_msgs_enviadas: (conversa.agente_msgs_enviadas ?? 0) + 1 }).eq('id', conversaId)
    enviada = true
  }

  await registrar(conversaId, enviada ? resposta : null, usadas, transferencia, cfg.modelo_conversa, tokensIn, tokensOut)
  if (transferencia) await transferir(conversaId, lead, transferencia.motivo, transferencia.resumo)
}

function ferramentaSimular(e: Record<string, unknown>, cfg: ConfigSim): string {
  const produto = e.produto === 'financiamento' ? 'financiamento' : 'home_equity'
  const imovel = Number(e.valor_imovel)
  const credito = Number(e.valor_credito)
  const prazo = Math.min(240, Math.max(60, Math.round(Number(e.prazo_meses ?? 240))))
  const sistema = e.sistema === 'sac' ? 'sac' : 'price'
  const r = simular(
    { produto, valorImovelCentavos: Math.round(imovel * 100), valorCreditoCentavos: Math.round(credito * 100), taxaMensal: cfg.taxa_min, prazoMeses: prazo, carenciaDias: 30, sistema },
    cfg,
  )
  if (r.erros.includes('credito_acima_teto')) {
    return 'O crédito pedido passa do limite de ' + Math.round(r.ltvMax * 100) + '% do imóvel. O máximo para este imóvel é ' + formatarBRL(r.tetoCreditoCentavos) + '.'
  }
  if (r.erros.includes('credito_abaixo_minimo')) return 'O crédito mínimo é ' + formatarBRL(cfg.credito_min_centavos) + '.'
  if (r.erros.length) return 'Não foi possível simular com esses valores.'
  return (
    'Parcela estimada: ' + formatarBRL(r.parcelaCentavos) + ' por mês em ' + prazo + 'x (' + (sistema === 'price' ? 'Price' : 'SAC, primeira parcela') +
    '), taxa a partir de ' + formatarPercentual(cfg.taxa_min) + ' a.m. + ' + cfg.indexador +
    '. Não inclui IPCA, seguros e tarifas. É uma estimativa para o melhor perfil, sujeita à análise do banco.'
  )
}

async function ferramentaAtualizar(leadId: string, e: Record<string, unknown>, ufs: string[]): Promise<string> {
  const patch: Record<string, unknown> = {}
  if (typeof e.nome === 'string' && e.nome.trim().length > 1) patch.nome = e.nome.trim().slice(0, 120)
  if (typeof e.cidade === 'string' && e.cidade.trim()) patch.cidade = e.cidade.trim().slice(0, 120)
  if (typeof e.uf === 'string' && /^[A-Za-z]{2}$/.test(e.uf)) {
    patch.uf = e.uf.toUpperCase()
    patch.fora_regiao = !ufs.includes(e.uf.toUpperCase())
  }
  if (e.produto === 'home_equity' || e.produto === 'financiamento' || e.produto === 'portabilidade') patch.produto = e.produto
  if (!Object.keys(patch).length) return 'nada para atualizar'
  await admin().from('leads').update(patch).eq('id', leadId)
  return 'dados atualizados'
}

async function registrar(
  conversaId: string,
  resposta: string | null,
  ferramentas: string[],
  t: { motivo: string; resumo: string } | null,
  modelo: string,
  tin: number,
  tout: number,
  nota?: string,
) {
  await admin().from('agente_log').insert({
    conversa_id: conversaId,
    resposta: resposta ?? nota ?? null,
    ferramentas,
    transferiu: !!t,
    motivo_transferencia: t?.motivo ?? null,
    modelo,
    tokens_in: tin,
    tokens_out: tout,
  })
}

async function transferir(conversaId: string, lead: LeadResumo, motivo: string, resumo: string) {
  const db = admin()
  await db.from('conversas').update({ agente_ativo: false, agente_pausado_por: 'transferencia', agente_pausado_em: new Date().toISOString() }).eq('id', conversaId)
  const patch: Record<string, unknown> = { resumo_ia: resumo }
  if (motivo === 'qualificado' && !lead.etapa_travada_humano && ['novo', 'em_atendimento'].includes(lead.etapa)) patch.etapa = 'qualificado'
  await db.from('leads').update(patch).eq('id', lead.id)
  if (!lead.usuario_id) return
  const [{ data: u }, { data: inst }] = await Promise.all([
    db.from('usuarios').select('whatsapp_alerta').eq('id', lead.usuario_id).maybeSingle(),
    db.from('instancias').select('id').eq('usuario_id', lead.usuario_id).eq('status', 'conectada').limit(1).maybeSingle(),
  ])
  if (u?.whatsapp_alerta && inst) {
    await enviarSemRegistro(inst.id, u.whatsapp_alerta, 'O agente passou para você: ' + (lead.nome ?? mascarar(lead.whatsapp_e164)) + '. ' + resumo).catch((e) =>
      console.error('alerta de transferência', e),
    )
  }
}
