import 'server-only'
import { admin } from '@/lib/supabase/admin'
import { CONFIG_PADRAO, type ConfigSimulador } from '@/lib/financeiro'

/** Lê uma configuração editável no painel. Se o banco não responder, usa o padrão do código. */
export async function lerConfig<T>(chave: string, padrao: T): Promise<T> {
  try {
    const { data } = await admin().from('configuracoes').select('valor').eq('chave', chave).maybeSingle()
    return (data?.valor as T) ?? padrao
  } catch {
    return padrao
  }
}

export const lerConfigSimulador = () => lerConfig<ConfigSimulador>('simulador', CONFIG_PADRAO)
export const lerUfsAtendidas = async () => (await lerConfig<{ ufs: string[] }>('regioes', { ufs: ['MG', 'SP', 'MS', 'MT', 'PR', 'SC', 'RS', 'RJ', 'ES'] })).ufs
