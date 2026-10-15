// Cria o primeiro usuário gestor (depois dele, a equipe é criada pelo painel, em Equipe).
// Uso (no seu computador, com as variáveis do .env.local carregadas):
//   node --env-file=.env.local scripts/criar-gestor.mjs "Fernando" fernando@exemplo.com "uma-senha-longa-e-unica"
import { createClient } from '@supabase/supabase-js'

const [nome, email, senha] = process.argv.slice(2)
if (!nome || !email || !senha || senha.length < 10) {
  console.error('Uso: node --env-file=.env.local scripts/criar-gestor.mjs "Nome" email senha(10+ caracteres)')
  process.exit(1)
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !chave) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const db = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
const { data, error } = await db.auth.admin.createUser({ email: email.toLowerCase(), password: senha, email_confirm: true })
if (error || !data.user) {
  console.error('Não foi possível criar o usuário:', error?.message)
  process.exit(1)
}
const { error: erroPerfil } = await db.from('usuarios').insert({ id: data.user.id, nome, email: email.toLowerCase(), papel: 'gestor' })
if (erroPerfil) {
  await db.auth.admin.deleteUser(data.user.id)
  console.error('Não foi possível salvar o perfil:', erroPerfil.message)
  process.exit(1)
}
console.log('Gestor criado:', email.toLowerCase(), '- entre em /painel/login')
