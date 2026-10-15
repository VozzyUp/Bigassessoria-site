import Link from 'next/link'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { ETAPAS, MOTIVOS_PERDA, temperaturaDe } from '@/lib/funil'
import { formatarBRL } from '@/lib/financeiro'
import { mascarar } from '@/lib/telefone'
import { moverEtapa } from '../../acoes'

export const dynamic = 'force-dynamic'

type Lead = {
  id: string
  nome: string | null
  whatsapp_e164: string
  etapa: string
  temperatura: number | null
  produto: string | null
  fora_regiao: boolean
  etapa_em: string
  resumo_ia: string | null
  simulacoes: { valor_credito_centavos: number }[]
}

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export default async function Funil({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  const supabase = await supabaseDoUsuario()
  const { data, error } = await supabase
    .from('leads')
    .select('id, nome, whatsapp_e164, etapa, temperatura, produto, fora_regiao, etapa_em, resumo_ia, simulacoes(valor_credito_centavos)')
    .order('etapa_em', { ascending: false })
    .limit(500)
  const leads = (data ?? []) as unknown as Lead[]

  return (
    <main className="painel-pagina">
      <h1>Funil</h1>
      {erro === 'motivo' ? <p role="alert" className="aviso-erro">Escolha o motivo da perda para mover o lead para Perdido.</p> : null}
      {erro === 'falha' || error ? <p role="alert" className="aviso-erro">Não foi possível salvar. Tente de novo.</p> : null}

      <div className="kanban">
        {ETAPAS.map((etapa) => {
          const cards = leads.filter((l) => l.etapa === etapa.id)
          return (
            <section key={etapa.id} className="kcol" aria-label={etapa.nome}>
              <h2>{etapa.nome} <span>{cards.length}</span></h2>
              {cards.length === 0 ? <p className="vazio">Nenhum lead</p> : null}
              {cards.map((l) => {
                const temp = temperaturaDe(l.temperatura)
                const valor = l.simulacoes?.[0]?.valor_credito_centavos
                return (
                  <article key={l.id} className="kcard">
                    <div className="t">
                      <Link href={'/painel/leads/' + l.id}><b>{l.nome ?? mascarar(l.whatsapp_e164)}</b></Link>
                      {temp ? <span className={'badge ' + (temp === 'quente' ? 'b-hot' : temp === 'morno' ? 'b-warm' : '')}>{temp} {l.temperatura}</span> : null}
                    </div>
                    {valor ? <div className="val num">{formatarBRL(valor)}</div> : null}
                    {l.resumo_ia ? <p>{l.resumo_ia}</p> : null}
                    <p className="meta">
                      {diasDesde(l.etapa_em) > 0 ? diasDesde(l.etapa_em) + ' d nesta etapa' : 'hoje'}
                      {l.fora_regiao ? ' · fora da região' : ''}
                    </p>
                    <form action={moverEtapa} className="mover">
                      <input type="hidden" name="id" value={l.id} />
                      <label className="sr-only" htmlFor={'e-' + l.id}>Mover {l.nome ?? 'lead'} para</label>
                      <select id={'e-' + l.id} name="etapa" defaultValue={l.etapa}>
                        {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                      </select>
                      <select name="motivo" defaultValue="" aria-label="Motivo da perda (só se for para Perdido)">
                        <option value="">Motivo (se perdido)</option>
                        {MOTIVOS_PERDA.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                      </select>
                      <button className="btn btn-secondary btn-sm" type="submit">Mover</button>
                    </form>
                  </article>
                )
              })}
            </section>
          )
        })}
      </div>
    </main>
  )
}
