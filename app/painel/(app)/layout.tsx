import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseDoUsuario } from '@/lib/supabase/server'
import { MarcaBig } from '@/components/Icone'
import { sair } from '../acoes'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseDoUsuario()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/painel/login')
  const { data: eu } = await supabase.from('usuarios').select('nome, papel').eq('id', auth.user.id).maybeSingle()

  return (
    <div className="painel">
      <aside className="painel-lado">
        <span className="logo"><MarcaBig /><span className="w"><b>BIG</b><span>painel</span></span></span>
        <nav aria-label="Painel">
          <Link href="/painel/conversas">Conversas</Link>
          <Link href="/painel/funil">Funil</Link>
          <Link href="/painel/dashboard">Dashboard</Link>
          {eu?.papel === 'gestor' ? (
            <>
              <Link href="/painel/agente">Agente de IA</Link>
              <Link href="/painel/conexoes">Conexões</Link>
              <Link href="/painel/configuracoes">Configurações</Link>
              <Link href="/painel/depoimentos">Depoimentos</Link>
              <Link href="/painel/equipe">Equipe</Link>
            </>
          ) : null}
        </nav>
        <div className="painel-eu">
          <span>{eu?.nome ?? auth.user.email}</span>
          <small>{eu?.papel === 'gestor' ? 'Gestor' : eu?.papel === 'vendedor' ? 'Vendedor' : 'Sem perfil'}</small>
          <form action={sair}><button className="btn btn-ghost btn-sm" type="submit">Sair</button></form>
        </div>
      </aside>
      <div className="painel-conteudo">{children}</div>
    </div>
  )
}
