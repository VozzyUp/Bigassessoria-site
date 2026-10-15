import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { exigirGestor } from '@/lib/painel/gestor'
import { FormDepoimento, LinhaDepoimento } from './Forms'

export const dynamic = 'force-dynamic'

export default async function Depoimentos() {
  if (!(await exigirGestor())) redirect('/painel/conversas')
  const supabase = await supabaseDoUsuario()
  const { data } = await supabase.from('depoimentos').select('id, nome, cidade, uf, texto, nota, fonte, publicado, autorizacao_em').order('created_at', { ascending: false })
  return (
    <main className="painel-pagina">
      <h1>Depoimentos</h1>
      <p className="meta">Só entram no site depoimentos reais, com autorização do cliente, e só depois de publicados aqui. Sem nenhum publicado, a seção some do site.</p>
      <section className="cartao" style={{ marginTop: 16 }} aria-labelledby="d-t">
        <h2 id="d-t">Cadastrados</h2>
        {!data?.length ? <p className="vazio">Nenhum depoimento cadastrado.</p> : (
          <ul>{data.map((d) => <LinhaDepoimento key={d.id} d={d} />)}</ul>
        )}
      </section>
      <FormDepoimento />
    </main>
  )
}
