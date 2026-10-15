import { describe, expect, it } from 'vitest'
import { atrasoHumano, deveResponder, dentroDoHorario, HORARIO_PADRAO, limparResposta, violaRegras } from './regras'

// 2026-10-14 é uma quarta-feira. 15:00Z = 12:00 em Brasília.
const em = (iso: string) => new Date(iso)

describe('dentroDoHorario', () => {
  it('quarta ao meio-dia (Brasília): dentro', () => expect(dentroDoHorario(HORARIO_PADRAO, em('2026-10-14T15:00:00Z'))).toBe(true))
  it('quarta às 22h (Brasília): fora', () => expect(dentroDoHorario(HORARIO_PADRAO, em('2026-10-15T01:00:00Z'))).toBe(false))
  it('quarta às 8h (Brasília): fora, abre às 8h30', () => expect(dentroDoHorario(HORARIO_PADRAO, em('2026-10-14T11:00:00Z'))).toBe(false))
  it('sábado às 10h (Brasília): dentro pelo horário reduzido', () => expect(dentroDoHorario(HORARIO_PADRAO, em('2026-10-17T13:00:00Z'))).toBe(true))
  it('sábado às 14h (Brasília): fora', () => expect(dentroDoHorario(HORARIO_PADRAO, em('2026-10-17T17:00:00Z'))).toBe(false))
  it('domingo: fora', () => expect(dentroDoHorario(HORARIO_PADRAO, em('2026-10-18T15:00:00Z'))).toBe(false))
})

describe('deveResponder', () => {
  const ok = { globalAtivo: true, instanciaAtiva: true, conversaAtiva: true, msgsEnviadas: 2, maxMsgs: 12, fromMeRecente: false }
  it('responde quando tudo está ligado', () => expect(deveResponder(ok)).toEqual({ responder: true }))
  it.each([
    ['globalAtivo', false],
    ['instanciaAtiva', false],
    ['conversaAtiva', false],
    ['fromMeRecente', true],
  ] as const)('não responde quando %s = %s', (campo, valor) => expect(deveResponder({ ...ok, [campo]: valor }).responder).toBe(false))
  it('para no limite de mensagens', () => expect(deveResponder({ ...ok, msgsEnviadas: 12 }).responder).toBe(false))
})

describe('violaRegras', () => {
  it.each([
    'Sua aprovação garantida sai hoje!',
    'A taxa final é 1,19%.',
    'Me envie seu CPF e RG por aqui.',
    'Sou uma pessoa, pode confiar.',
  ])('bloqueia: %s', (t) => expect(violaRegras(t)).not.toBeNull())
  it.each([
    'A taxa a partir de 1,19% a.m. é para o melhor perfil e depende da análise do banco.',
    'Para enviar documentos, o especialista libera um código seguro.',
    'Qual o valor aproximado do imóvel?',
  ])('libera: %s', (t) => expect(violaRegras(t)).toBeNull())
})

describe('limparResposta e atrasoHumano', () => {
  it('troca **negrito** por *negrito* e tira títulos', () => expect(limparResposta('## Oi\n**Taxa** a partir de 1,19%')).toBe('Oi\n*Taxa* a partir de 1,19%'))
  it('corta textos longos', () => expect(limparResposta('a'.repeat(2000), 100)).toHaveLength(100))
  it('atraso fica dentro da faixa', () => {
    expect(atrasoHumano([4, 12], () => 0)).toBe(4000)
    expect(atrasoHumano([4, 12], () => 1)).toBe(12000)
  })
})
