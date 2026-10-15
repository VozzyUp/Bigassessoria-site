import { describe, expect, it } from 'vitest'
import { formatarDuracao, funil, motivosDePerda, porCanal, respostaPorVendedor, type LeadLinha } from './dashboard'

const l = (id: string, etapa: string, canal: string | null = null, tipo: string | null = null, motivo: string | null = null): LeadLinha => ({
  id,
  etapa,
  canal_nome: canal,
  canal_tipo: tipo,
  usuario_nome: 'André',
  motivo_perda: motivo,
})

describe('funil', () => {
  it('conta o lead em todas as etapas até a atual', () => {
    const r = funil([l('1', 'novo'), l('2', 'qualificado'), l('3', 'proposta')], [])
    const m = Object.fromEntries(r.map((x) => [x.etapa, x.total]))
    expect(m.novo).toBe(3)
    expect(m.qualificado).toBe(2)
    expect(m.proposta).toBe(1)
    expect(m.liberado).toBe(0)
  })
  it('lead perdido conta nas etapas por onde passou (histórico)', () => {
    const r = funil([l('1', 'perdido', null, null, 'taxa')], [{ lead_id: '1', para: 'qualificado' }])
    expect(r.find((x) => x.etapa === 'qualificado')?.total).toBe(1)
    expect(r.find((x) => x.etapa === 'documentacao')?.total).toBe(0)
  })
})

describe('porCanal', () => {
  const leads = [l('1', 'qualificado', 'Google Ads', 'google_ads'), l('2', 'novo', 'Google Ads', 'google_ads'), l('3', 'liberado', 'Instagram', 'instagram')]
  it('calcula custo por lead e por qualificado só para canais pagos', () => {
    const r = porCanal(leads, [], [{ plataforma: 'google_ads', valor_centavos: 100_000 }])
    const g = r.find((x) => x.canal === 'Google Ads')!
    expect(g.leads).toBe(2)
    expect(g.cplCentavos).toBe(50_000)
    expect(g.custoQualificadoCentavos).toBe(100_000)
    expect(r.find((x) => x.canal === 'Instagram')!.cplCentavos).toBeNull()
  })
  it('não divide por zero', () => {
    const r = porCanal([l('1', 'novo', 'Google Ads', 'google_ads')], [], [{ plataforma: 'google_ads', valor_centavos: 5000 }])
    expect(r[0].custoQualificadoCentavos).toBeNull()
  })
})

describe('outros', () => {
  it('motivos de perda ordenados', () => {
    const r = motivosDePerda([l('1', 'perdido', null, null, 'taxa'), l('2', 'perdido', null, null, 'taxa'), l('3', 'perdido', null, null, 'sem_retorno')])
    expect(r[0]).toEqual({ motivo: 'taxa', total: 2 })
  })
  it('mediana do tempo de resposta', () => {
    const r = respostaPorVendedor([1, 2, 3, 100].map((s) => ({ usuario_nome: 'André', primeira_resposta_seg: s })))
    expect(r[0].medianaSeg).toBe(3)
  })
  it('formata durações', () => {
    expect(formatarDuracao(45)).toBe('45 s')
    expect(formatarDuracao(300)).toBe('5 min')
    expect(formatarDuracao(5400)).toBe('1,5 h')
  })
})
