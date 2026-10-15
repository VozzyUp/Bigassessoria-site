import { supabaseDoUsuario } from '@/lib/supabase/server'
import { NOME_ETAPA, MOTIVOS_PERDA } from '@/lib/funil'
import { formatarBRL } from '@/lib/financeiro'
import { formatarDuracao, funil, motivosDePerda, porCanal, respostaPorVendedor, type LeadLinha } from '@/lib/dashboard'
import { GastoForm } from './GastoForm'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const um = <T,>(v: Rel<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)
const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '—')

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias: d } = await searchParams
  const dias = [7, 30, 90].includes(Number(d)) ? Number(d) : 30
  const desde = diasAtras(dias)
  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  const { data: eu } = await supabase.from('usuarios').select('papel').eq('id', auth.user?.id ?? '').maybeSingle()
  const gestor = eu?.papel === 'gestor'

  const [{ data: bruto }, { data: hist }, { data: gastosBrutos }, { data: respostas }] = await Promise.all([
    supabase.from('leads').select('id, etapa, motivo_perda, canais(nome, tipo), usuarios(nome)').gte('created_at', desde).limit(5000),
    supabase.from('etapa_historico').select('lead_id, para').gte('created_at', desde).limit(20000),
    supabase.from('gastos_anuncio').select('plataforma, valor_centavos').gte('dia', desde.slice(0, 10)).limit(5000),
    supabase.from('conversas').select('primeira_resposta_seg, leads(usuarios(nome))').not('primeira_resposta_seg', 'is', null).gte('created_at', desde).limit(5000),
  ])

  const leads: LeadLinha[] = (bruto ?? []).map((l) => {
    const c = um(l.canais as Rel<{ nome: string; tipo: string }>)
    const u = um(l.usuarios as Rel<{ nome: string }>)
    return { id: l.id as string, etapa: l.etapa as string, motivo_perda: l.motivo_perda as string | null, canal_nome: c?.nome ?? null, canal_tipo: c?.tipo ?? null, usuario_nome: u?.nome ?? null }
  })
  const f = funil(leads, hist ?? [])
  const canais = porCanal(leads, hist ?? [], gastosBrutos ?? [])
  const perdas = motivosDePerda(leads)
  const tempos = respostaPorVendedor(
    (respostas ?? []).map((r) => {
      const lead = um(r.leads as Rel<{ usuarios: Rel<{ nome: string }> }>)
      return { usuario_nome: um(lead?.usuarios ?? null)?.nome ?? null, primeira_resposta_seg: r.primeira_resposta_seg as number | null }
    }),
  )
  const gastoTotal = (gastosBrutos ?? []).reduce((s, g) => s + g.valor_centavos, 0)
  const topo = f[0]?.total ?? 0
  const nomeMotivo = (id: string) => MOTIVOS_PERDA.find((m) => m.id === id)?.nome ?? id

  return (
    <main className="painel-pagina">
      <h1>Dashboard</h1>
      <nav aria-label="Período" style={{ display: 'flex', gap: 8, margin: '4px 0 18px' }}>
        {[7, 30, 90].map((n) => (
          <a key={n} href={'/painel/dashboard?dias=' + n} className={'btn btn-sm ' + (n === dias ? 'btn-brand' : 'btn-secondary')}>{n} dias</a>
        ))}
      </nav>

      <div className="ficha">
        <section className="cartao"><h2>Contatos</h2><p className="kpi num">{topo}</p></section>
        <section className="cartao"><h2>Contratos liberados</h2><p className="kpi num">{f[7]?.total ?? 0}</p><p className="meta">{pct(f[7]?.total ?? 0, topo)} dos contatos</p></section>
        <section className="cartao"><h2>Gasto em anúncios</h2><p className="kpi num">{gestor ? formatarBRL(gastoTotal) : '—'}</p><p className="meta">{gestor && topo && gastoTotal ? 'Custo por contato: ' + formatarBRL(Math.round(gastoTotal / topo)) : ' '}</p></section>
      </div>

      <section className="cartao" aria-labelledby="f-t" style={{ marginTop: 12 }}>
        <h2 id="f-t">Funil no período</h2>
        <table className="tabela">
          <thead><tr><th>Etapa</th><th>Contatos</th><th>% do total</th><th>Da etapa anterior</th></tr></thead>
          <tbody>{f.map((e, i) => (
            <tr key={e.etapa}><td>{NOME_ETAPA[e.etapa]}</td><td className="num">{e.total}</td><td>{pct(e.total, topo)}</td><td>{i ? pct(e.total, f[i - 1].total) : '—'}</td></tr>
          ))}</tbody>
        </table>
      </section>

      <section className="cartao" aria-labelledby="c-t" style={{ marginTop: 12 }}>
        <h2 id="c-t">Por canal</h2>
        {!canais.length ? <p className="vazio">Sem contatos no período.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabela">
              <thead><tr><th>Canal</th><th>Contatos</th><th>Qualificados</th><th>Propostas</th><th>Contratos</th>{gestor ? <><th>Custo/contato</th><th>Custo/qualificado</th></> : null}</tr></thead>
              <tbody>{canais.map((c) => (
                <tr key={c.canal}><td>{c.canal}</td><td className="num">{c.leads}</td><td className="num">{c.qualificados}</td><td className="num">{c.propostas}</td><td className="num">{c.contratos}</td>
                  {gestor ? <><td className="num">{c.cplCentavos !== null ? formatarBRL(c.cplCentavos) : '—'}</td><td className="num">{c.custoQualificadoCentavos !== null ? formatarBRL(c.custoQualificadoCentavos) : '—'}</td></> : null}</tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <div className="ficha" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', marginTop: 12 }}>
        <section className="cartao">
          <h2>Tempo de primeira resposta</h2>
          {!tempos.length ? <p className="vazio">Ainda sem respostas medidas.</p> : (
            <ul>{tempos.map((t) => <li key={t.vendedor}><b>{t.vendedor}</b>: mediana {formatarDuracao(t.medianaSeg)} <span className="meta">({t.n} conversas)</span></li>)}</ul>
          )}
        </section>
        <section className="cartao">
          <h2>Motivos de perda</h2>
          {!perdas.length ? <p className="vazio">Nenhum contato perdido no período.</p> : (
            <ul>{perdas.map((p) => <li key={p.motivo}>{nomeMotivo(p.motivo)}: <b>{p.total}</b></li>)}</ul>
          )}
        </section>
      </div>

      {gestor ? <GastoForm /> : null}
    </main>
  )
}
