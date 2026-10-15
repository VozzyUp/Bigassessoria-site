import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Renova a sessão do Supabase e protege o painel. Só roda nas rotas /painel.
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !chave) return resposta

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value))
        resposta = NextResponse.next({ request })
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const logado = !!data?.claims
  const naTelaDeLogin = request.nextUrl.pathname === '/painel/login'

  if (!logado && !naTelaDeLogin) return NextResponse.redirect(new URL('/painel/login', request.url))
  if (logado && naTelaDeLogin) return NextResponse.redirect(new URL('/painel/conversas', request.url))
  return resposta
}

export const config = { matcher: ['/painel/:path*'] }
