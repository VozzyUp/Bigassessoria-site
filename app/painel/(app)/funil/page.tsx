import { supabaseDoUsuario } from '@/lib/supabase/server'
import { mascarar } from '@/lib/telefone'
import { Quadro, type Card } from './Quadro'

export const dynamic = 'force-dynamic'

type Lead = {
  id: string
  nome: string | null
  whatsapp_e164: string
  etapa: string
  temperatura: number | null
  fora_regiao: boolean
  etapa_em: string
  resumo_ia: string | null
  simulacoes: { valor_credito_centavos: number }[]
}

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export default async function Funil() {
  const supabase = await supabaseDoUsuario()
  const { data, error } = await supabase
    .from('leads')
    .select('id, nome, whatsapp_e164, etapa, temperatura, fora_regiao, etapa_em, resumo_ia, simulacoes(valor_credito_centavos)')
    .order('etapa_em', { ascending: false })
    .limit(500)
  const leads = (data ?? []) as unknown as Lead[]
  const cards: Card[] = leads.map((l) => ({
    id: l.id,
    titulo: l.nome ?? mascarar(l.whatsapp_e164),
    etapa: l.etapa,
    temperatura: l.temperatura,
    valorCentavos: l.simulacoes?.[0]?.valor_credito_centavos ?? null,
    resumo: l.resumo_ia,
    diasNaEtapa: diasDesde(l.etapa_em),
    foraRegiao: l.fora_regiao,
  }))

  return (
    <main className="painel-pagina">
      <h1>Funil</h1>
      <p className="meta">Arraste um contato para outra etapa, ou use o seletor no cartão. Mover manualmente impede que a IA mude a etapa depois.</p>
      {error ? <p role="alert" className="aviso-erro">Não foi possível carregar os contatos.</p> : null}
      <Quadro inicial={cards} />
    </main>
  )
}
