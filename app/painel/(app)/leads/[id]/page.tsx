import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { NOME_ETAPA } from '@/lib/funil'
import { formatarBRL, formatarPercentual } from '@/lib/financeiro'
import { mascarar } from '@/lib/telefone'

export const dynamic = 'force-dynamic'

const hora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const ORIGEM: Record<string, string> = {
  cliente: 'Cliente',
  aparelho: 'Vendedor (celular)',
  painel: 'Vendedor (painel)',
  agente_ia: 'Agente IA',
  sistema: 'Sistema',
}

export default async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const supabase = await supabaseDoUsuario()

  const { data: lead } = await supabase
    .from('leads')
    .select('id, nome, email, whatsapp_e164, uf, cidade, fora_regiao, produto, etapa, temperatura, resumo_ia, proximo_passo_ia, created_at, canal_id, primeiro_toque, ultimo_toque, canais(nome)')
    .eq('id', id)
    .maybeSingle()
  if (!lead) notFound()

  const [{ data: sims }, { data: hist }, { data: conversas }] = await Promise.all([
    supabase
      .from('simulacoes')
      .select('id, produto, valor_imovel_centavos, valor_credito_centavos, prazo_meses, taxa_mensal, sistema, parcela_centavos, ltv, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('etapa_historico').select('id, de, para, por, created_at').eq('lead_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('conversas').select('id').eq('lead_id', id),
  ])
  const ids = (conversas ?? []).map((c) => c.id)
  const { data: msgs } = ids.length
    ? await supabase
        .from('mensagens')
        .select('id, direcao, enviado_por, tipo, texto, transcricao, enviado_em')
        .in('conversa_id', ids)
        .order('enviado_em', { ascending: true })
        .limit(300)
    : { data: [] }

  const canal = Array.isArray(lead.canais) ? lead.canais[0] : lead.canais
  const toque = (lead.primeiro_toque ?? {}) as { utm?: Record<string, string>; gclid?: string; fbclid?: string; landing?: string }
  const utms = toque.utm ? Object.entries(toque.utm).map(([k, v]) => k.replace('utm_', '') + '=' + v).join(', ') : ''

  return (
    <main className="painel-pagina">
      <p><Link href="/painel/funil">← Funil</Link></p>
      <h1>{lead.nome ?? 'Sem nome'}</h1>
      <p className="meta">
        {mascarar(lead.whatsapp_e164)} · {lead.email ?? 'sem e-mail'} · {lead.cidade ? lead.cidade + '/' : ''}{lead.uf ?? '—'}
        {lead.fora_regiao ? ' (fora da região)' : ''}
      </p>
      <p><span className="badge b-brand">{NOME_ETAPA[lead.etapa] ?? lead.etapa}</span></p>
      {lead.resumo_ia ? <p><b>Resumo:</b> {lead.resumo_ia}</p> : null}
      {lead.proximo_passo_ia ? <p><b>Próximo passo:</b> {lead.proximo_passo_ia}</p> : null}

      <div className="ficha">
        <section className="cartao">
          <h2>Simulações</h2>
          {!sims?.length ? (
            <p className="vazio">Nenhuma simulação.</p>
          ) : (
            <ul>
              {sims.map((s) => (
                <li key={s.id}>
                  <b className="num">{formatarBRL(s.valor_credito_centavos)}</b> em {s.prazo_meses}x ({s.sistema === 'price' ? 'Price' : 'SAC'}, {formatarPercentual(Number(s.taxa_mensal))} a.m.)
                  <br />
                  Parcela {formatarBRL(s.parcela_centavos)} · imóvel {formatarBRL(s.valor_imovel_centavos)} · LTV {Math.round(Number(s.ltv) * 100)}% · {hora(s.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cartao">
          <h2>Origem</h2>
          <p>Canal: <b>{canal?.nome ?? 'site (sem canal)'}</b></p>
          <p className="meta">
            {toque.landing ? 'Página: ' + toque.landing : ''}
            {utms ? ' · ' + utms : ''}
            {toque.gclid ? ' · Google Ads' : ''}
            {toque.fbclid ? ' · Meta' : ''}
          </p>
        </section>

        <section className="cartao">
          <h2>Histórico de etapas</h2>
          {!hist?.length ? (
            <p className="vazio">Sem mudanças ainda.</p>
          ) : (
            <ul>
              {hist.map((h) => (
                <li key={h.id}>
                  {h.de ? NOME_ETAPA[h.de] : 'Início'} → <b>{NOME_ETAPA[h.para]}</b>{' '}
                  <span className="meta">por {h.por} · {hora(h.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="cartao" aria-labelledby="conv-t">
        <h2 id="conv-t">Conversa</h2>
        {!msgs?.length ? (
          <p className="vazio">Nenhuma mensagem ainda. Quando o cliente falar no WhatsApp, aparece aqui.</p>
        ) : (
          <div className="chat">
            {msgs.map((m) => (
              <div key={m.id} className={'bubble ' + (m.direcao === 'entrada' ? 'b-in' : m.enviado_por === 'agente_ia' ? 'b-ai' : 'b-out')}>
                {m.enviado_por === 'agente_ia' ? <span className="ai-tag">IA</span> : null}
                {m.texto ?? m.transcricao ?? '(' + m.tipo + ')'}
                <small>{ORIGEM[m.enviado_por] ?? m.enviado_por} · {hora(m.enviado_em)}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
