// Limite simples em memória, por instância do servidor. Serve para a primeira entrega.
// Antes de produção: trocar por Upstash Redis (várias instâncias serverless não compartilham memória).
const janelas = new Map<string, { inicio: number; n: number }>()

export function limitar(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now()
  const j = janelas.get(chave)
  if (!j || agora - j.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, n: 1 })
    if (janelas.size > 5000) for (const [k, v] of janelas) if (agora - v.inicio > janelaMs) janelas.delete(k)
    return true
  }
  j.n += 1
  return j.n <= max
}
