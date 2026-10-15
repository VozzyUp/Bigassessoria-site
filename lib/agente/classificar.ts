import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { admin } from '@/lib/supabase/admin'
import { lerConfig } from '@/lib/config'
import { paraTurnos } from './executar'

const PROMPT = `Você analisa conversas de WhatsApp de uma assessoria de crédito imobiliário (crédito com garantia de imóvel, financiamento e portabilidade) e classifica o cliente.
Responda SOMENTE com um objeto JSON, sem texto antes ou depois, neste formato:
{"etapa":"novo|em_atendimento|qualificado","temperatura":0-100,"resumo":"uma frase","proximo_passo":"uma frase","dados":{"valor_imovel":numero|null,"valor_credito":numero|null,"cidade":"texto|null","uf":"SP|null","imovel_quitado":true|false|null,"urgencia":"30d|1-3m|3-6m|planejando|null"}}
Regras:
- "qualificado" só se o cliente tem imóvel em MG, SP, MS, MT, PR, SC, RS, RJ ou ES, já informou valor do imóvel e quanto precisa, e quer seguir.
- Temperatura: 0-39 frio (curioso, sem urgência, sem dados), 40-69 morno, 70-100 quente (imóvel quitado ou com margem, valor definido, urgência, respondendo rápido).
- Use somente o que está na conversa. Não invente dados.`

interface Resultado {
  etapa?: string
  temperatura?: number
  resumo?: string
  proximo_passo?: string
  dados?: Record<string, unknown>
}

function extrairJson(texto: string): Resultado | null {
  const ini = texto.indexOf('{')
  const fim = texto.lastIndexOf('}')
  if (ini < 0 || fim <= ini) return null
  try {
    return JSON.parse(texto.slice(ini, fim + 1)) as Resultado
  } catch {
    return null
  }
}

/** Lê a conversa inteira do lead, pede a classificação ao modelo barato e guarda o resultado. */
export async function classificarLead(leadId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return
  const db = admin()
  const { data: lead } = await db.from('leads').select('id, etapa, etapa_travada_humano').eq('id', leadId).maybeSingle()
  if (!lead) return
  const { data: conversas } = await db.from('conversas').select('id').eq('lead_id', leadId)
  const ids = (conversas ?? []).map((c) => c.id)
  if (!ids.length) return
  const { data: hist } = await db
    .from('mensagens')
    .select('direcao, enviado_por, texto, transcricao, enviado_em')
    .in('conversa_id', ids)
    .order('enviado_em', { ascending: false })
    .limit(40)
  const turnos = paraTurnos(((hist ?? []) as Parameters<typeof paraTurnos>[0]).reverse())
  if (!turnos.length) return

  const cfg = await lerConfig<{ modelo_classificacao?: string }>('agente', {})
  const modelo = cfg.modelo_classificacao ?? 'claude-haiku-5-5'
  const transcricao = turnos.map((t) => (t.role === 'user' ? 'Cliente: ' : 'Atendente: ') + String(t.content)).join('\n')

  const r = await new Anthropic().messages.create({ model: modelo, max_tokens: 400, system: PROMPT, messages: [{ role: 'user', content: transcricao }] })
  const bruto = r.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text').map((b) => b.text).join('')
  const j = extrairJson(bruto)
  if (!j) return

  const temperatura = typeof j.temperatura === 'number' ? Math.max(0, Math.min(100, Math.round(j.temperatura))) : null
  const etapaSugerida = ['novo', 'em_atendimento', 'qualificado'].includes(j.etapa ?? '') ? j.etapa : null
  // a IA só avança até "Qualificado", e nunca contra uma decisão humana
  const sobe = !lead.etapa_travada_humano && etapaSugerida === 'qualificado' && ['novo', 'em_atendimento'].includes(lead.etapa)

  await db.from('classificacoes').insert({
    lead_id: leadId,
    etapa_sugerida: etapaSugerida,
    temperatura,
    resumo: j.resumo?.slice(0, 300) ?? null,
    proximo_passo: j.proximo_passo?.slice(0, 300) ?? null,
    dados_extraidos: j.dados ?? {},
    modelo,
    tokens_in: r.usage.input_tokens,
    tokens_out: r.usage.output_tokens,
    aplicada: sobe || temperatura !== null,
  })

  const patch: Record<string, unknown> = {}
  if (temperatura !== null) patch.temperatura = temperatura
  if (j.resumo) patch.resumo_ia = j.resumo.slice(0, 300)
  if (j.proximo_passo) patch.proximo_passo_ia = j.proximo_passo.slice(0, 300)
  if (sobe) patch.etapa = 'qualificado'
  if (Object.keys(patch).length) await db.from('leads').update(patch).eq('id', leadId)
}
