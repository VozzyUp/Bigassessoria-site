import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { exigirGestor } from '@/lib/painel/gestor'
import { CONFIG_PADRAO, type ConfigSimulador } from '@/lib/financeiro'
import { FormSimulador } from './FormSimulador'

export const dynamic = 'force-dynamic'

export default async function Configuracoes() {
  if (!(await exigirGestor())) redirect('/painel/conversas')
  const supabase = await supabaseDoUsuario()
  const { data } = await supabase.from('configuracoes').select('chave, valor').in('chave', ['simulador', 'regioes'])
  const sim = ((data ?? []).find((c) => c.chave === 'simulador')?.valor ?? CONFIG_PADRAO) as ConfigSimulador
  const ufs = (((data ?? []).find((c) => c.chave === 'regioes')?.valor ?? { ufs: [] }) as { ufs: string[] }).ufs

  const pct = (v: number) => String(+(v * 100).toFixed(2)).replace('.', ',')
  return (
    <main className="painel-pagina">
      <h1>Configurações</h1>
      <p className="meta">Estes valores aparecem no simulador do site e valem para o agente de IA. O site se atualiza sozinho em até 5 minutos.</p>
      <FormSimulador
        inicial={{
          taxaMin: pct(sim.taxa_min),
          taxas: sim.taxas.map(pct).join(' '),
          ltvHe: pct(sim.ltv.home_equity),
          ltvFin: pct(sim.ltv.financiamento),
          prazos: sim.prazos.join(' '),
          ufs: ufs.join(' '),
        }}
      />
    </main>
  )
}
