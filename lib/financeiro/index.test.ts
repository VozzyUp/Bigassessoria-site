import { describe, expect, it } from 'vitest'
import { CONFIG_PADRAO, capacidadeDeCredito, simular, type EntradaSimulacao } from './index'

const base: EntradaSimulacao = {
  produto: 'home_equity',
  valorImovelCentavos: 100_000_000,
  valorCreditoCentavos: 50_000_000,
  taxaMensal: 0.0119,
  prazoMeses: 240,
  carenciaDias: 30,
  sistema: 'price',
}

describe('simular', () => {
  it('Price: R$ 500 mil, 1,19% a.m., 240 meses = R$ 6.319,54 (referência conferida)', () => {
    expect(simular(base).parcelaCentavos).toBe(631_954)
  })

  it('SAC: primeira parcela R$ 8.033,33 e última R$ 2.108,13', () => {
    const r = simular({ ...base, sistema: 'sac' })
    expect(r.parcelaCentavos).toBe(803_333)
    expect(r.ultimaParcelaCentavos).toBe(210_813)
  })

  it('mostra a parcela do outro sistema para o comparativo', () => {
    const r = simular(base)
    expect(r.outraParcelaCentavos).toBe(803_333)
    expect(r.outraUltimaCentavos).toBe(210_813)
  })

  it('carência de 60 dias capitaliza 1 mês de juros no saldo', () => {
    const r = simular({ ...base, carenciaDias: 60 })
    expect(r.parcelaCentavos).toBe(Math.round(631_954 * 1.0119))
  })

  it('carência de 90 dias capitaliza 2 meses de juros', () => {
    const r = simular({ ...base, carenciaDias: 90 })
    expect(r.parcelaCentavos).toBeGreaterThan(simular({ ...base, carenciaDias: 60 }).parcelaCentavos)
  })

  it('LTV: home equity limita em 60% e financiamento em 80% do imóvel', () => {
    const he = simular({ ...base, valorCreditoCentavos: 70_000_000 })
    expect(he.tetoCreditoCentavos).toBe(60_000_000)
    expect(he.erros).toContain('credito_acima_teto')
    const fin = simular({ ...base, produto: 'financiamento', valorCreditoCentavos: 70_000_000 })
    expect(fin.tetoCreditoCentavos).toBe(80_000_000)
    expect(fin.erros).toEqual([])
  })

  it('o teto nunca passa de R$ 10 milhões', () => {
    const r = simular({ ...base, valorImovelCentavos: 5_000_000_000, valorCreditoCentavos: 1_500_000_000 })
    expect(r.tetoCreditoCentavos).toBe(CONFIG_PADRAO.credito_max_centavos)
    expect(r.erros).toContain('credito_acima_teto')
  })

  it('crédito abaixo de R$ 100 mil e taxa abaixo do mínimo geram erro', () => {
    expect(simular({ ...base, valorCreditoCentavos: 5_000_000 }).erros).toContain('credito_abaixo_minimo')
    expect(simular({ ...base, taxaMensal: 0.0099 }).erros).toContain('taxa_abaixo_minima')
  })

  it('entrada inválida não gera NaN', () => {
    const r = simular({ ...base, valorCreditoCentavos: 0 })
    expect(r.erros).toEqual(['entrada_invalida'])
    expect(r.parcelaCentavos).toBe(0)
  })

  it('LTV calculado é crédito / imóvel', () => {
    expect(simular(base).ltv).toBeCloseTo(0.5, 6)
  })
})

describe('capacidadeDeCredito', () => {
  it('parcela máxima de 30% da renda e crédito que ela paga no Price', () => {
    const r = capacidadeDeCredito({ rendaMensalCentavos: 2_000_000, taxaMensal: 0.0119, prazoMeses: 240 })
    expect(r.parcelaMaximaCentavos).toBe(600_000)
    // volta ao mesmo valor pela conta direta do simulador
    const volta = simular({ produto: 'financiamento', valorImovelCentavos: 100_000_000, valorCreditoCentavos: r.creditoCentavos, taxaMensal: 0.0119, prazoMeses: 240, carenciaDias: 30, sistema: 'price' })
    expect(Math.abs(volta.parcelaCentavos - 600_000)).toBeLessThanOrEqual(5)
  })
  it('respeita o limite do imóvel (80%) quando informado', () => {
    const r = capacidadeDeCredito({ rendaMensalCentavos: 5_000_000, taxaMensal: 0.0119, prazoMeses: 240, valorImovelCentavos: 30_000_000 })
    expect(r.creditoCentavos).toBe(24_000_000)
    expect(r.limitadoPeloImovel).toBe(true)
  })
  it('renda zero não gera NaN', () => {
    expect(capacidadeDeCredito({ rendaMensalCentavos: 0, taxaMensal: 0.0119, prazoMeses: 240 }).creditoCentavos).toBe(0)
  })
})
