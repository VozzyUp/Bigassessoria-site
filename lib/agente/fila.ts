// Junta mensagens em sequência do cliente antes de responder (debounce por conversa) e evita
// que duas execuções rodem juntas na mesma conversa. Fica em memória: uma réplica só.
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const emExecucao = new Set<string>()

export function agendar(chave: string, aposMs: number, fn: () => Promise<void>) {
  const anterior = timers.get(chave)
  if (anterior) clearTimeout(anterior)
  timers.set(
    chave,
    setTimeout(() => {
      timers.delete(chave)
      if (emExecucao.has(chave)) {
        // já está respondendo: tenta de novo depois, para pegar a mensagem nova
        agendar(chave, 5_000, fn)
        return
      }
      emExecucao.add(chave)
      fn()
        .catch((e) => console.error('[agente]', chave, e))
        .finally(() => emExecucao.delete(chave))
    }, aposMs),
  )
}
