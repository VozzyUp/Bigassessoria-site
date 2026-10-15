// Leitura das respostas das APIs de anúncios. Funções puras: recebem o JSON e devolvem gasto por campanha em centavos.

export interface GastoDia {
  plataforma: 'google_ads' | 'meta'
  campanha: string
  dia: string // AAAA-MM-DD
  valorCentavos: number
}

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {})

/** Meta Marketing API, insights por campanha: { data: [{ campaign_name, spend: "12.34", date_start }] } */
export function parseMeta(json: unknown): GastoDia[] {
  const lista = obj(json).data
  if (!Array.isArray(lista)) return []
  const saida: GastoDia[] = []
  for (const l of lista) {
    const i = obj(l)
    const gasto = Number(i.spend)
    const dia = typeof i.date_start === 'string' ? i.date_start : null
    if (!dia || !Number.isFinite(gasto) || gasto < 0) continue
    saida.push({ plataforma: 'meta', campanha: String(i.campaign_name ?? 'sem nome').slice(0, 120), dia, valorCentavos: Math.round(gasto * 100) })
  }
  return saida
}

/** Google Ads searchStream: [{ results: [{ campaign: { name }, metrics: { costMicros }, segments: { date } }] }] */
export function parseGoogle(json: unknown): GastoDia[] {
  const lotes = Array.isArray(json) ? json : [json]
  const saida: GastoDia[] = []
  for (const lote of lotes) {
    const resultados = obj(lote).results
    if (!Array.isArray(resultados)) continue
    for (const r of resultados) {
      const o = obj(r)
      const micros = Number(obj(o.metrics).costMicros)
      const dia = obj(o.segments).date
      if (typeof dia !== 'string' || !Number.isFinite(micros) || micros < 0) continue
      saida.push({ plataforma: 'google_ads', campanha: String(obj(o.campaign).name ?? 'sem nome').slice(0, 120), dia, valorCentavos: Math.round(micros / 10_000) })
    }
  }
  return saida
}
