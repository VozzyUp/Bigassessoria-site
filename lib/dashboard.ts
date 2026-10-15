// Agregações do dashboard. Funções puras: recebem linhas já lidas do banco (com o RLS do usuário) e devolvem números.

export const ORDEM = ['novo', 'em_atendimento', 'qualificado', 'documentacao', 'analise', 'proposta', 'contrato', 'liberado'] as const
type Etapa = (typeof ORDEM)[number]
const indice = (e: string) => ORDEM.indexOf(e as Etapa)

export interface LeadLinha {
  id: string
  etapa: string
  canal_tipo: string | null
  canal_nome: string | null
  usuario_nome: string | null
  motivo_perda: string | null
}
export interface HistoricoLinha { lead_id: string; para: string }
export interface GastoLinha { plataforma: string; valor_centavos: number }
export interface RespostaLinha { usuario_nome: string | null; primeira_resposta_seg: number | null }

/** Conjunto de leads que chegaram a cada etapa (por etapa atual ou por passagem registrada no histórico). */
function chegadas(leads: LeadLinha[], hist: HistoricoLinha[]): Map<string, Set<string>> {
  const por = new Map<string, Set<string>>(ORDEM.map((e) => [e, new Set<string>()]))
  const dentro = new Set(leads.map((l) => l.id))
  const marca = (id: string, ate: number) => {
    for (let k = 0; k <= ate; k++) por.get(ORDEM[k])!.add(id)
  }
  for (const l of leads) marca(l.id, Math.max(indice(l.etapa), 0))
  for (const h of hist) if (dentro.has(h.lead_id) && indice(h.para) >= 0) marca(h.lead_id, indice(h.para))
  return por
}

/** Quantos leads chegaram a cada etapa. */
export function funil(leads: LeadLinha[], hist: HistoricoLinha[]): { etapa: string; total: number }[] {
  const por = chegadas(leads, hist)
  return ORDEM.map((etapa) => ({ etapa, total: por.get(etapa)!.size }))
}

export interface LinhaCanal {
  canal: string
  leads: number
  qualificados: number
  propostas: number
  contratos: number
  gastoCentavos: number | null
  cplCentavos: number | null
  custoQualificadoCentavos: number | null
}

const PLATAFORMA_DO_TIPO: Record<string, string> = { google_ads: 'google_ads', meta_ads: 'meta' }

export function porCanal(leads: LeadLinha[], hist: HistoricoLinha[], gastos: GastoLinha[]): LinhaCanal[] {
  const por = chegadas(leads, hist)
  const grupos = new Map<string, { tipo: string | null; itens: LeadLinha[] }>()
  for (const l of leads) {
    const nome = l.canal_nome ?? 'Site (sem canal)'
    const g = grupos.get(nome) ?? { tipo: l.canal_tipo, itens: [] }
    g.itens.push(l)
    grupos.set(nome, g)
  }
  const gastoPlataforma = new Map<string, number>()
  for (const g of gastos) gastoPlataforma.set(g.plataforma, (gastoPlataforma.get(g.plataforma) ?? 0) + g.valor_centavos)

  return [...grupos.entries()]
    .map(([canal, g]) => {
      const plataforma = g.tipo ? PLATAFORMA_DO_TIPO[g.tipo] : undefined
      const gasto = plataforma ? (gastoPlataforma.get(plataforma) ?? null) : null
      const n = g.itens.length
      const conta = (etapa: Etapa) => g.itens.filter((l) => por.get(etapa)!.has(l.id)).length
      const nq = conta('qualificado')
      return {
        canal,
        leads: n,
        qualificados: nq,
        propostas: conta('proposta'),
        contratos: conta('liberado'),
        gastoCentavos: gasto,
        cplCentavos: gasto !== null && n ? Math.round(gasto / n) : null,
        custoQualificadoCentavos: gasto !== null && nq ? Math.round(gasto / nq) : null,
      }
    })
    .sort((a, b) => b.leads - a.leads)
}

export function motivosDePerda(leads: LeadLinha[]): { motivo: string; total: number }[] {
  const m = new Map<string, number>()
  for (const l of leads) if (l.etapa === 'perdido' && l.motivo_perda) m.set(l.motivo_perda, (m.get(l.motivo_perda) ?? 0) + 1)
  return [...m.entries()].map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total)
}

/** Tempo de primeira resposta por vendedor (mediana, que não é distorcida por um caso muito longo). */
export function respostaPorVendedor(linhas: RespostaLinha[]): { vendedor: string; medianaSeg: number; n: number }[] {
  const por = new Map<string, number[]>()
  for (const r of linhas) {
    if (r.primeira_resposta_seg === null) continue
    const k = r.usuario_nome ?? 'Sem vendedor'
    por.set(k, [...(por.get(k) ?? []), r.primeira_resposta_seg])
  }
  return [...por.entries()]
    .map(([vendedor, v]) => {
      const o = [...v].sort((a, b) => a - b)
      const meio = Math.floor(o.length / 2)
      return { vendedor, medianaSeg: o.length % 2 ? o[meio] : Math.round((o[meio - 1] + o[meio]) / 2), n: o.length }
    })
    .sort((a, b) => a.medianaSeg - b.medianaSeg)
}

export function formatarDuracao(seg: number): string {
  if (seg < 60) return seg + ' s'
  if (seg < 3600) return Math.round(seg / 60) + ' min'
  if (seg < 86400) return (seg / 3600).toFixed(1).replace('.', ',') + ' h'
  return (seg / 86400).toFixed(1).replace('.', ',') + ' d'
}
