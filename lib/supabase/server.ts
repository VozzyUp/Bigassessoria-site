import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cliente do painel: roda como o usuário logado, então o RLS vale. */
export async function supabaseDoUsuario() {
  const store = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => store.set(name, value, options))
          } catch {
            // chamado de um Server Component: o proxy renova a sessão
          }
        },
      },
    },
  )
}
