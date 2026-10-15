import 'server-only'
import { admin } from '@/lib/supabase/admin'
import { tokenDeAcessoGoogle } from '@/lib/conversoes/google'
import { parseGoogle, parseMeta, type GastoDia } from './parse'

const ymd = (d: Date) => d.toISOString().slice(0, 10)

async function buscarMeta(dia: string): Promise<GastoDia[]> {
  const conta = process.env.META_AD_ACCOUNT_ID?.replace(/\D/g, '')
  const token = process.env.META_ADS_TOKEN ?? process.env.META_CAPI_TOKEN
  if (!conta || !token) return []
  const versao = process.env.META_API_VERSION ?? 'v21.0'
  const url =
    'https://graph.facebook.com/' + versao + '/act_' + conta + '/insights?level=campaign&fields=campaign_name,spend&time_increment=1&limit=200' +
    '&time_range=' + encodeURIComponent(JSON.stringify({ since: dia, until: dia })) + '&access_token=' + encodeURIComponent(token)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Meta insights respondeu ' + res.status)
  return parseMeta(await res.json())
}

async function buscarGoogle(dia: string): Promise<GastoDia[]> {
  const cliente = (process.env.GOOGLE_ADS_CUSTOMER_ID ?? '').replace(/\D/g, '')
  const dev = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!cliente || !dev) return []
  const versao = process.env.GOOGLE_ADS_API_VERSION ?? 'v21'
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await tokenDeAcessoGoogle()), 'developer-token': dev }
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id'] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/\D/g, '')
  const res = await fetch('https://googleads.googleapis.com/' + versao + '/customers/' + cliente + '/googleAds:searchStream', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: "SELECT campaign.name, metrics.cost_micros, segments.date FROM campaign WHERE segments.date = '" + dia + "'" }),
  })
  if (!res.ok) throw new Error('Google Ads respondeu ' + res.status)
  return parseGoogle(await res.json())
}

/** Importa o gasto de ontem e anteontem (o Google e a Meta ajustam valores por até 48 h). Idempotente por (plataforma, campanha, dia). */
export async function importarGastos(): Promise<{ linhas: number }> {
  const db = admin()
  const dias = [1, 2].map((n) => ymd(new Date(Date.now() - n * 86_400_000)))
  let linhas = 0
  for (const dia of dias) {
    const todos: GastoDia[] = []
    for (const buscar of [buscarMeta, buscarGoogle]) {
      try {
        todos.push(...(await buscar(dia)))
      } catch (e) {
        console.error('[gastos]', e instanceof Error ? e.message : e)
      }
    }
    if (!todos.length) continue
    const { error } = await db.from('gastos_anuncio').upsert(
      todos.map((g) => ({ plataforma: g.plataforma, campanha: g.campanha, dia: g.dia, valor_centavos: g.valorCentavos, origem: 'api' })),
      { onConflict: 'plataforma,campanha,dia' },
    )
    if (error) console.error('[gastos] upsert', error.message)
    else linhas += todos.length
  }
  return { linhas }
}
