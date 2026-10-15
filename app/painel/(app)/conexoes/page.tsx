import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { exigirGestor } from '@/lib/painel/gestor'
import { mascarar } from '@/lib/telefone'
import { FormNumero } from './FormNumero'

export const dynamic = 'force-dynamic'

const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'nunca'

export default async function Conexoes() {
  if (!(await exigirGestor())) redirect('/painel/conversas')
  const supabase = await supabaseDoUsuario()
  const [{ data: insts }, { data: usuarios }] = await Promise.all([
    supabase.from('instancias').select('id, uazapi_instance, numero_e164, status, ultimo_evento_em, usuarios(nome)').order('created_at'),
    supabase.from('usuarios').select('id, nome').eq('ativo', true).order('nome'),
  ])
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://SEU-DOMINIO'
  const segredoOk = !!process.env.UAZAPI_WEBHOOK_SECRET

  return (
    <main className="painel-pagina">
      <h1>Conexões do WhatsApp</h1>
      <p className="meta">Cada vendedor usa um número comercial conectado na UAZAPI. As mensagens que ele digita no celular também chegam aqui.</p>

      <section className="cartao" style={{ marginTop: 16 }} aria-labelledby="c-t">
        <h2 id="c-t">Números cadastrados</h2>
        {!insts?.length ? (
          <p className="vazio">Nenhum número cadastrado ainda.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabela">
              <thead>
                <tr><th>Vendedor</th><th>Número</th><th>Instância</th><th>Estado</th><th>Último sinal</th><th>Webhook (cole na UAZAPI)</th></tr>
              </thead>
              <tbody>
                {insts.map((i) => {
                  const u = (Array.isArray(i.usuarios) ? i.usuarios[0] : i.usuarios) as { nome?: string } | null
                  return (
                    <tr key={i.id}>
                      <td>{u?.nome ?? '—'}</td>
                      <td>{i.numero_e164 ? mascarar(i.numero_e164) : '—'}</td>
                      <td>{i.uazapi_instance}</td>
                      <td><span className={'badge ' + (i.status === 'conectada' ? 'b-ok' : 'b-hot')}>{i.status === 'conectada' ? 'Conectada' : 'Desconectada'}</span></td>
                      <td>{hora(i.ultimo_evento_em)}</td>
                      <td><code style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{site}/api/webhooks/uazapi/{i.uazapi_instance}?t=SEGREDO</code></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="meta" style={{ marginTop: 10 }}>
          Troque SEGREDO pelo valor de UAZAPI_WEBHOOK_SECRET do servidor{segredoOk ? ' (já configurado)' : ' (ainda não configurado: o webhook recusa tudo até configurar)'}. Se um número desconectar, leia o QR code de novo no painel da UAZAPI.
        </p>
      </section>

      <FormNumero vendedores={(usuarios ?? []).map((u) => ({ id: u.id as string, nome: u.nome as string }))} />
    </main>
  )
}
