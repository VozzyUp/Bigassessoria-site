import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cliente: SupabaseClient | null = null

/** Cliente com a service role. Só no servidor: ignora o RLS, então toda entrada tem de ser validada antes. */
export function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new ErroConfig('SUPABASE_SERVICE_ROLE_KEY não configurada')
  cliente ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return cliente
}

export class ErroConfig extends Error {}
