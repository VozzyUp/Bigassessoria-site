import 'server-only'
import { cookies } from 'next/headers'
import { COOKIE_SESSAO, verificarSessao, type SessaoDoc } from './seguranca'

/** Lê a sessão do cliente a partir do cookie. Devolve null se ausente, adulterada ou vencida. */
export async function sessaoDoCliente(): Promise<SessaoDoc | null> {
  try {
    return verificarSessao((await cookies()).get(COOKIE_SESSAO)?.value)
  } catch {
    return null
  }
}
