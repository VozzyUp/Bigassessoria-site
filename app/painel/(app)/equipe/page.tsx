import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { exigirGestor } from '@/lib/painel/gestor'
import { FormUsuario } from './FormUsuario'

export const dynamic = 'force-dynamic'

export default async function Equipe() {
  if (!(await exigirGestor())) redirect('/painel/conversas')
  const supabase = await supabaseDoUsuario()
  const { data: usuarios } = await supabase.from('usuarios').select('id, nome, email, papel, ativo, whatsapp_alerta').order('nome')
  return (
    <main className="painel-pagina">
      <h1>Equipe</h1>
      <section className="cartao" style={{ marginTop: 16 }} aria-labelledby="e-t">
        <h2 id="e-t">Usuários</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabela">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Alertas no WhatsApp</th></tr></thead>
            <tbody>
              {(usuarios ?? []).map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.papel === 'gestor' ? 'Gestor' : 'Vendedor'}{u.ativo ? '' : ' (inativo)'}</td>
                  <td>{u.whatsapp_alerta ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <FormUsuario />
    </main>
  )
}
