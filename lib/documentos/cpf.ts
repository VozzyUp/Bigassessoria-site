/** Valida o CPF pelos dois dígitos verificadores. Aceita com ou sem pontuação. */
export function cpfValido(entrada: string): boolean {
  const d = entrada.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digito = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10])
}

export const soDigitos = (v: string) => v.replace(/\D/g, '')
