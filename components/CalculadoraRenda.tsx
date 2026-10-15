'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CONFIG_PADRAO, capacidadeDeCredito, formatarBRL, formatarPercentual, type ConfigSimulador } from '@/lib/financeiro'

const reais = (txt: string) => {
  const d = txt.replace(/\D/g, '')
  return d ? parseInt(d, 10) : 0
}
const mascara = (n: number) => (n ? n.toLocaleString('pt-BR') : '')

/** "Quanto posso financiar?": parte da renda, não do imóvel. Estimativa, sujeita à análise do banco. */
export function CalculadoraRenda({ config = CONFIG_PADRAO }: { config?: ConfigSimulador }) {
  const [renda, setRenda] = useState(8_000)
  const [prazo, setPrazo] = useState(config.prazos.includes(240) ? 240 : config.prazos[config.prazos.length - 1])
  const r = useMemo(() => capacidadeDeCredito({ rendaMensalCentavos: renda * 100, taxaMensal: config.taxa_min, prazoMeses: prazo }, config), [renda, prazo, config])

  return (
    <section className="band" aria-labelledby="cap-t" style={{ background: 'var(--surface)' }}>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <p className="eyebrow">Calculadora</p>
        <h2 id="cap-t" style={{ fontSize: 'clamp(26px,3.4vw,34px)', lineHeight: 1.15, color: 'var(--brand-strong)', margin: '8px 0 16px' }}>
          Quanto posso financiar com a minha renda?
        </h2>
        <div className="cartao">
          <div className="grade2">
            <div className="tf">
              <label htmlFor="cap-renda">Renda mensal comprovada (R$)</label>
              <input id="cap-renda" inputMode="numeric" value={mascara(renda)} onChange={(e) => setRenda(reais(e.target.value))} />
            </div>
            <div className="tf">
              <label htmlFor="cap-prazo">Prazo</label>
              <select id="cap-prazo" value={prazo} onChange={(e) => setPrazo(Number(e.target.value))}>
                {config.prazos.map((p) => <option key={p} value={p}>{p} meses</option>)}
              </select>
            </div>
          </div>
          <div className="result" style={{ marginTop: 16 }} aria-live="polite">
            <div className="main" style={{ gridColumn: '1 / -1', borderBottom: 0, paddingBottom: 0 }}>
              <div className="k">Crédito estimado</div>
              <div className="v num">{r.creditoCentavos ? formatarBRL(r.creditoCentavos) : '—'}</div>
              <div className="sub">Parcela de até {formatarBRL(r.parcelaMaximaCentavos)} (30% da renda) · taxa a partir de {formatarPercentual(config.taxa_min)} a.m. + {config.indexador}</div>
            </div>
          </div>
          <p className="meta" style={{ margin: '12px 0' }}>Estimativa pela regra comum de comprometer até 30% da renda. A análise do banco considera também dívidas, idade e o valor do imóvel.</p>
          <Link className="btn btn-primary" href="/financiamento-imobiliario#simulador">Simular com o valor do imóvel</Link>
        </div>
      </div>
    </section>
  )
}
