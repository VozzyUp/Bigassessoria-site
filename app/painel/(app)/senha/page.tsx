import { TrocarSenha } from './TrocarSenha'

export default function Senha() {
  return (
    <main className="painel-pagina">
      <h1>Minha senha</h1>
      <p className="meta">Troque a senha temporária no primeiro acesso. Use ao menos 10 caracteres.</p>
      <TrocarSenha />
    </main>
  )
}
