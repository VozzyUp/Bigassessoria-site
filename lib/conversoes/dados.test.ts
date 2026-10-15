import { describe, expect, it } from 'vitest'
import { emailHash, nomeHash, sha256, telefoneHash } from './dados'

describe('hash para as plataformas de anúncio', () => {
  it('telefone usa só dígitos, com o 55', () => {
    expect(telefoneHash('+5555991688677')).toBe(sha256('5555991688677'))
  })
  it('e-mail é normalizado (minúsculo, sem espaços) antes do hash', () => {
    expect(emailHash('  Fulano@Email.COM ')).toBe(sha256('fulano@email.com'))
  })
  it('e-mail inválido não gera hash', () => {
    expect(emailHash('sem-arroba')).toBeNull()
  })
  it('nome perde acento e pontuação', () => {
    expect(nomeHash(' José-André ')).toBe(sha256('joseandre'))
  })
  it('hash é estável e tem 64 caracteres', () => {
    expect(sha256('a')).toHaveLength(64)
    expect(sha256('a')).toBe(sha256('a'))
  })
})
