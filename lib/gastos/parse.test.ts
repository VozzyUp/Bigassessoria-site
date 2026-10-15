import { describe, expect, it } from 'vitest'
import { parseGoogle, parseMeta } from './parse'

describe('parseMeta', () => {
  it('converte o gasto em centavos por campanha e dia', () => {
    const r = parseMeta({ data: [{ campaign_name: 'Home equity RS', spend: '123.45', date_start: '2026-10-14' }] })
    expect(r).toEqual([{ plataforma: 'meta', campanha: 'Home equity RS', dia: '2026-10-14', valorCentavos: 12345 }])
  })
  it('ignora linhas sem data ou com gasto inválido', () => {
    expect(parseMeta({ data: [{ campaign_name: 'a', spend: 'x', date_start: '2026-10-14' }, { campaign_name: 'b', spend: '1' }] })).toEqual([])
  })
  it('resposta inesperada vira lista vazia', () => {
    expect(parseMeta(null)).toEqual([])
    expect(parseMeta({ erro: true })).toEqual([])
  })
})

describe('parseGoogle', () => {
  it('converte micros em centavos (1 real = 1.000.000 micros)', () => {
    const r = parseGoogle([{ results: [{ campaign: { name: 'Pesquisa HE' }, metrics: { costMicros: '45670000' }, segments: { date: '2026-10-14' } }] }])
    expect(r[0]).toEqual({ plataforma: 'google_ads', campanha: 'Pesquisa HE', dia: '2026-10-14', valorCentavos: 4567 })
  })
  it('aceita vários lotes do streaming e ignora lixo', () => {
    const r = parseGoogle([{ results: [] }, { results: [{ campaign: { name: 'A' }, metrics: { costMicros: 1_000_000 }, segments: { date: '2026-10-13' } }, { nada: 1 }] }])
    expect(r).toHaveLength(1)
    expect(r[0].valorCentavos).toBe(100)
  })
})
