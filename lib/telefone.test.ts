import { describe, expect, it } from 'vitest'
import { mascarar, paraE164, variantes } from './telefone'

describe('paraE164', () => {
  it.each([
    ['(55) 99168-8677', '+5555991688677'],
    ['5555991688677', '+5555991688677'],
    ['+55 55 9916-88677', '+5555991688677'],
    ['55991688677', '+5555991688677'],
    ['(55) 3333-4444', '+555533334444'],
  ])('%s -> %s', (entrada, esperado) => expect(paraE164(entrada)).toBe(esperado))

  it.each(['', '123', '(55) 89168-8677', '(00) 99168-8677', '9916-8677'])('rejeita %j', (e) => expect(paraE164(e)).toBeNull())
})

describe('variantes', () => {
  it('celular com 9 também procura sem o 9', () => {
    expect(variantes('+5555991688677')).toEqual(['+5555991688677', '+555591688677'])
  })
  it('celular sem o 9 também procura com o 9', () => {
    expect(variantes('+555591688677')).toEqual(['+555591688677', '+5555991688677'])
  })
  it('fixo não ganha 9', () => {
    expect(variantes('+555533334444')).toEqual(['+555533334444'])
  })
})

describe('mascarar', () => {
  it('formata', () => expect(mascarar('+5555991688677')).toBe('(55) 99168-8677'))
})
