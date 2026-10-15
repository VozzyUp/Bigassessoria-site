import 'server-only'
import { enviarConversoesPendentes } from '@/lib/conversoes/enviar'
import { verificarAlertas } from './alertas'
import { importarGastos } from '@/lib/gastos/importar'
import { admin } from '@/lib/supabase/admin'

const g = globalThis as unknown as { __bigJobs?: boolean }

async function executar(nome: string, fn: () => Promise<unknown>) {
  try {
    const r = await fn()
    if (r && typeof r === 'object' && Object.values(r).some((v) => typeof v === 'number' && v > 0)) console.log('[job]', nome, JSON.stringify(r))
  } catch (e) {
    console.error('[job]', nome, 'falhou:', e instanceof Error ? e.message : e)
  }
}

async function limparCodigos() {
  // revoga os códigos vencidos que ainda estavam "ativos" (libera o índice de um código por lead)
  await admin().from('codigos_acesso').update({ revogado_em: new Date().toISOString() }).lt('expira_em', new Date().toISOString()).is('usado_em', null).is('revogado_em', null)
}

/**
 * Tarefas em segundo plano dentro do próprio container (uma réplica só). Desligadas por padrão fora de
 * produção: ligue com JOBS_ATIVOS=true. Com mais de uma réplica, mover para um agendador externo.
 */
export function iniciarJobs() {
  if (g.__bigJobs || process.env.JOBS_ATIVOS !== 'true') return
  g.__bigJobs = true
  console.log('[job] agendador iniciado')
  const minutos = (n: number) => n * 60_000
  setInterval(() => void executar('conversoes', () => enviarConversoesPendentes()), minutos(2))
  setInterval(() => void executar('alertas', verificarAlertas), minutos(5))
  setInterval(() => void executar('codigos', limparCodigos), minutos(60))
  // gasto de anúncios: a cada 6 horas (só faz algo se as credenciais da Meta/Google estiverem configuradas)
  setInterval(() => void executar('gastos', importarGastos), minutos(360))
}
