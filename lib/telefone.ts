// Telefones brasileiros em E.164 (+55DDNNNNNNNNN). Celulares antigos aparecem com e sem o 9º dígito.

/** Aceita "(55) 99168-8677", "5555991688677", "+55 55 9916-88677", "55991688677". Devolve null se não for BR válido. */
export function paraE164(entrada: string): string | null {
  let d = entrada.replace(/\D/g, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2)
  if (d.length !== 10 && d.length !== 11) return null
  if (d[0] === '0' || d[1] === '0') return null
  if (d.length === 11 && d[2] !== '9') return null
  return '+55' + d
}

/** Variantes do mesmo número com e sem o 9 (para achar o lead mesmo que o WhatsApp devolva o JID antigo). */
export function variantes(e164: string): string[] {
  const d = e164.replace(/\D/g, '').slice(2)
  const lista = new Set<string>(['+55' + d])
  if (d.length === 11 && d[2] === '9') lista.add('+55' + d.slice(0, 2) + d.slice(3))
  if (d.length === 10 && /[6-9]/.test(d[2])) lista.add('+55' + d.slice(0, 2) + '9' + d.slice(2))
  return [...lista]
}

export function paraWaMe(e164: string): string {
  return e164.replace(/\D/g, '')
}

export function mascarar(e164: string): string {
  const d = e164.replace(/\D/g, '').slice(2)
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
}
