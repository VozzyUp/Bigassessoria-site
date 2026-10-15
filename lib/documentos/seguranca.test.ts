import { beforeAll, describe, expect, it } from 'vitest'
import { assinarSessao, gerarCodigo, hashCodigo, verificarSessao } from './seguranca'
import { cpfValido } from './cpf'

beforeAll(() => {
  process.env.DOCUMENTOS_SECRET = 'segredo-de-teste-com-mais-de-24-caracteres'
})

describe('código de acesso', () => {
  it('tem 6 dígitos', () => {
    for (let i = 0; i < 200; i++) expect(gerarCodigo()).toMatch(/^\d{6}$/)
  })
  it('o hash muda com o telefone: o mesmo código em outro número não vale', () => {
    expect(hashCodigo('+5555991688677', '123456')).not.toBe(hashCodigo('+5555991688678', '123456'))
  })
  it('o hash é estável', () => {
    expect(hashCodigo('+5555991688677', '123456')).toBe(hashCodigo('+5555991688677', '123456'))
  })
})

describe('sessão do cliente', () => {
  it('assina e verifica', () => {
    const t = assinarSessao('lead-1')
    expect(verificarSessao(t)?.lid).toBe('lead-1')
  })
  it('expira', () => {
    const t = assinarSessao('lead-1', 60, Date.now() - 120_000)
    expect(verificarSessao(t)).toBeNull()
  })
  it('rejeita token adulterado', () => {
    const [corpo, sig] = assinarSessao('lead-1').split('.')
    const outro = Buffer.from(JSON.stringify({ lid: 'lead-2', exp: 9_999_999_999 })).toString('base64url')
    expect(verificarSessao(outro + '.' + sig)).toBeNull()
    expect(verificarSessao(corpo + '.' + sig.slice(0, -2) + 'xx')).toBeNull()
  })
  it('rejeita vazio e lixo', () => {
    expect(verificarSessao(undefined)).toBeNull()
    expect(verificarSessao('abc')).toBeNull()
    expect(verificarSessao('a.b')).toBeNull()
  })
})

describe('cpfValido', () => {
  it.each(['529.982.247-25', '52998224725'])('aceita %s', (c) => expect(cpfValido(c)).toBe(true))
  it.each(['111.111.111-11', '529.982.247-24', '123', ''])('rejeita %j', (c) => expect(cpfValido(c)).toBe(false))
})
