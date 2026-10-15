import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { mascarar } from '@/lib/telefone'

const ETAPAS: Record<string, string> = {
  novo: 'Novo lead',
  em_atendimento: 'Em atendimento',
  qualificado: 'Qualificado',
  documentacao: 'Documentação',
  analise: 'Análise no banco',
  proposta: 'Proposta',
  contrato: 'Contrato',
  liberado: 'Liberado',
  perdido: 'Perdido',
}

function tempoRelativo(iso: string | null): string {
  if (!iso) return ''
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'agora'
  if (min < 60) return 'há ' + min + ' min'
  if (min < 1440) return 'há ' + Math.round(min / 60) + ' h'
  return 'há ' + Math.round(min / 1440) + ' d'
}

function minutosDesde(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 60000
}

export const dynamic = 'force-dynamic'

export default async function Conversas() {
  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/painel/login')

  // O RLS decide o que cada pessoa vê: o vendedor só os leads dele, o gestor todos.
  const { data: conversas, error } = await supabase
    .from('conversas')
    .select(
      'id, ultima_mensagem_em, aguardando_resposta_desde, agente_ativo, leads(id, nome, whatsapp_e164, etapa, temperatura, produto, fora_regiao), mensagens(texto, direcao, enviado_em)',
    )
    .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
    .order('enviado_em', { referencedTable: 'mensagens', ascending: false })
    .limit(1, { referencedTable: 'mensagens' })
    .limit(100)

  return (
    <main className="wrap" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand-strong)' }}>Conversas</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{auth.user.email}</p>

      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', marginTop: 20 }}>Não foi possível carregar as conversas.</p>
      ) : null}

      {!error && !conversas?.length ? (
        <div style={{ marginTop: 28, padding: 28, background: 'var(--bg)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 20 }}>Nenhuma conversa ainda</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Quando um cliente simular no site ou chamar no WhatsApp, a conversa aparece aqui.
          </p>
        </div>
      ) : null}

      <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gap: 10 }}>
        {conversas?.map((c) => {
          const lead = Array.isArray(c.leads) ? c.leads[0] : c.leads
          const ultima = Array.isArray(c.mensagens) ? c.mensagens[0] : null
          const esperando = c.aguardando_resposta_desde as string | null
          const minEsperando = esperando ? minutosDesde(esperando) : 0
          return (
            <li key={c.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px', display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>
                  {lead?.nome ?? 'Sem nome'}{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{lead ? mascarar(lead.whatsapp_e164) : ''}</span>
                </strong>
                <span className="badge b-brand">{lead ? ETAPAS[lead.etapa] ?? lead.etapa : ''}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, overflowWrap: 'anywhere' }}>
                {ultima ? (ultima.direcao === 'saida' ? 'Você: ' : '') + (ultima.texto ?? '(mídia)') : 'Sem mensagens'}
              </p>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span>{tempoRelativo(c.ultima_mensagem_em)}</span>
                {esperando ? (
                  <span style={{ color: minEsperando > 15 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                    aguardando resposta {tempoRelativo(esperando)}
                  </span>
                ) : null}
                {lead?.fora_regiao ? <span>fora da região</span> : null}
                <span>{c.agente_ativo ? 'agente de IA ativo' : 'agente de IA pausado'}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
