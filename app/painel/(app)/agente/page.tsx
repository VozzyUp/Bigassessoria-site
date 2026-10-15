import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { exigirGestor } from '@/lib/painel/gestor'
import { BASE_PADRAO } from '@/lib/agente/prompt'
import { mascarar } from '@/lib/telefone'
import { FormAgente, ToggleNumero } from './FormAgente'

export const dynamic = 'force-dynamic'

const hora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default async function Agente() {
  if (!(await exigirGestor())) redirect('/painel/conversas')
  const supabase = await supabaseDoUsuario()
  const [{ data: cfg }, { data: insts }, { data: logs }] = await Promise.all([
    supabase.from('configuracoes').select('chave, valor').in('chave', ['agente', 'agente_base']),
    supabase.from('instancias').select('id, numero_e164, status, agente_ativo, usuarios(nome)').order('created_at'),
    supabase.from('agente_log').select('id, resposta, ferramentas, transferiu, motivo_transferencia, modelo, tokens_in, tokens_out, created_at').order('created_at', { ascending: false }).limit(25),
  ])
  const agente = ((cfg ?? []).find((c) => c.chave === 'agente')?.valor ?? {}) as { ativo_global?: boolean; max_msgs_antes_humano?: number; atraso_seg?: [number, number] }
  const base = ((cfg ?? []).find((c) => c.chave === 'agente_base')?.valor ?? { texto: BASE_PADRAO }) as { texto: string }
  const ia = !!process.env.ANTHROPIC_API_KEY

  return (
    <main className="painel-pagina">
      <h1>Agente de IA</h1>
      <p className="meta">Faz o primeiro atendimento no WhatsApp: coleta os dados, simula a parcela e passa para o vendedor. Só responde a quem escreveu e para sozinho quando o vendedor responde.</p>
      {!ia ? <p role="alert" className="aviso-erro">A chave da IA (ANTHROPIC_API_KEY) não está configurada no servidor. O agente não responde até ela ser adicionada.</p> : null}

      <FormAgente
        inicial={{ ativoGlobal: !!agente.ativo_global, maxMsgs: String(agente.max_msgs_antes_humano ?? 12), atrasoMin: String(agente.atraso_seg?.[0] ?? 4), atrasoMax: String(agente.atraso_seg?.[1] ?? 12), base: base.texto }}
      />

      <section className="cartao" style={{ marginTop: 12 }} aria-labelledby="n-t">
        <h2 id="n-t">Por número de WhatsApp</h2>
        {!insts?.length ? <p className="vazio">Nenhum número cadastrado. Cadastre em Conexões.</p> : (
          <ul>{insts.map((i) => {
            const u = Array.isArray(i.usuarios) ? i.usuarios[0] : i.usuarios
            return <li key={i.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span><b>{(u as { nome?: string } | null)?.nome ?? 'Sem vendedor'}</b> {i.numero_e164 ? mascarar(i.numero_e164) : ''} <span className="meta">({i.status})</span></span>
              <ToggleNumero id={i.id} ativo={!!i.agente_ativo} />
            </li>
          })}</ul>
        )}
      </section>

      <section className="cartao" style={{ marginTop: 12 }} aria-labelledby="l-t">
        <h2 id="l-t">Últimas respostas e transferências</h2>
        {!logs?.length ? <p className="vazio">O agente ainda não respondeu nenhuma conversa.</p> : (
          <div style={{ overflowX: 'auto' }}><table className="tabela">
            <thead><tr><th>Quando</th><th>Resposta</th><th>Ferramentas</th><th>Passou para humano</th></tr></thead>
            <tbody>{logs.map((l) => (
              <tr key={l.id}><td>{hora(l.created_at)}</td><td style={{ maxWidth: 420 }}>{l.resposta ?? '(sem resposta)'}</td><td>{(l.ferramentas as string[]).join(', ') || '—'}</td><td>{l.transferiu ? 'Sim: ' + l.motivo_transferencia : 'Não'}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </main>
  )
}
