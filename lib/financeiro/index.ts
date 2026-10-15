// Cálculo do simulador. Funções puras, sem dependências. O servidor refaz esta conta ao gravar
// a simulação; o navegador usa a mesma função para responder na hora.

export type Sistema = 'price' | 'sac'
export type Produto = 'home_equity' | 'financiamento' | 'portabilidade' | 'outro'

export interface ConfigSimulador {
  credito_min_centavos: number
  credito_max_centavos: number
  ltv: { home_equity: number; financiamento: number }
  taxas: number[]
  taxa_min: number
  prazos: number[]
  carencias: number[]
  indexador: string
}

export const CONFIG_PADRAO: ConfigSimulador = {
  credito_min_centavos: 10_000_000,
  credito_max_centavos: 1_000_000_000,
  ltv: { home_equity: 0.6, financiamento: 0.8 },
  taxas: [0.0119, 0.0129, 0.0139, 0.0149, 0.0159, 0.0169],
  taxa_min: 0.0119,
  prazos: [60, 120, 180, 240],
  carencias: [30, 60, 90],
  indexador: 'IPCA',
}

export interface EntradaSimulacao {
  produto: Produto
  valorImovelCentavos: number
  valorCreditoCentavos: number
  taxaMensal: number
  prazoMeses: number
  carenciaDias: number
  sistema: Sistema
}

export type ErroSimulacao = 'credito_abaixo_minimo' | 'credito_acima_teto' | 'taxa_abaixo_minima' | 'entrada_invalida'

export interface ResultadoSimulacao {
  /** Price: parcela fixa. SAC: primeira parcela. */
  parcelaCentavos: number
  /** SAC: última parcela. Price: igual à parcela. */
  ultimaParcelaCentavos: number
  /** Parcela do outro sistema, para o comparativo. */
  outraParcelaCentavos: number
  outraUltimaCentavos: number
  ltv: number
  ltvMax: number
  tetoCreditoCentavos: number
  erros: ErroSimulacao[]
}

const arredonda = (n: number) => Math.round(n)

export function ltvMaximo(produto: Produto, cfg: ConfigSimulador = CONFIG_PADRAO): number {
  return produto === 'financiamento' ? cfg.ltv.financiamento : cfg.ltv.home_equity
}

/**
 * Carência: 30 dias = primeira parcela no mês seguinte, sem juros extras.
 * 60 e 90 dias = os juros dos meses a mais são capitalizados no saldo antes de calcular a parcela.
 * (Regra a confirmar com o banco parceiro.)
 */
export function simular(e: EntradaSimulacao, cfg: ConfigSimulador = CONFIG_PADRAO): ResultadoSimulacao {
  const erros: ErroSimulacao[] = []
  const ok =
    Number.isFinite(e.valorImovelCentavos) && e.valorImovelCentavos > 0 &&
    Number.isFinite(e.valorCreditoCentavos) && e.valorCreditoCentavos > 0 &&
    Number.isFinite(e.taxaMensal) && e.taxaMensal > 0 &&
    Number.isInteger(e.prazoMeses) && e.prazoMeses > 0
  if (!ok) erros.push('entrada_invalida')

  const ltvMax = ltvMaximo(e.produto, cfg)
  const teto = Math.min(arredonda(e.valorImovelCentavos * ltvMax), cfg.credito_max_centavos)
  if (ok && e.valorCreditoCentavos < cfg.credito_min_centavos) erros.push('credito_abaixo_minimo')
  if (ok && e.valorCreditoCentavos > teto) erros.push('credito_acima_teto')
  if (ok && e.taxaMensal < cfg.taxa_min - 1e-9) erros.push('taxa_abaixo_minima')

  if (!ok) {
    return { parcelaCentavos: 0, ultimaParcelaCentavos: 0, outraParcelaCentavos: 0, outraUltimaCentavos: 0, ltv: 0, ltvMax, tetoCreditoCentavos: teto, erros }
  }

  const i = e.taxaMensal
  const n = e.prazoMeses
  const mesesExtras = Math.max(0, e.carenciaDias / 30 - 1)
  const pv = (e.valorCreditoCentavos * Math.pow(1 + i, mesesExtras)) / 100 // em reais

  const price = (pv * i) / (1 - Math.pow(1 + i, -n))
  const amort = pv / n
  const sacPrimeira = amort + pv * i
  const sacUltima = amort + amort * i

  const isPrice = e.sistema === 'price'
  return {
    parcelaCentavos: arredonda((isPrice ? price : sacPrimeira) * 100),
    ultimaParcelaCentavos: arredonda((isPrice ? price : sacUltima) * 100),
    outraParcelaCentavos: arredonda((isPrice ? sacPrimeira : price) * 100),
    outraUltimaCentavos: arredonda((isPrice ? sacUltima : price) * 100),
    ltv: e.valorCreditoCentavos / e.valorImovelCentavos,
    ltvMax,
    tetoCreditoCentavos: teto,
    erros,
  }
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatarBRL = (centavos: number) => brl.format(centavos / 100)
export const formatarPercentual = (v: number, casas = 2) => (v * 100).toFixed(casas).replace('.', ',') + '%'

/**
 * Quanto de crédito cabe na renda: a parcela máxima é uma fatia da renda (30% por padrão, regra comum dos bancos)
 * e o valor é o que essa parcela paga no Price. O resultado respeita o limite em relação ao valor do imóvel, se informado.
 */
export function capacidadeDeCredito(
  p: { rendaMensalCentavos: number; taxaMensal: number; prazoMeses: number; comprometimento?: number; produto?: Produto; valorImovelCentavos?: number },
  cfg: ConfigSimulador = CONFIG_PADRAO,
): { parcelaMaximaCentavos: number; creditoCentavos: number; limitadoPeloImovel: boolean } {
  const frac = p.comprometimento ?? 0.3
  if (!(p.rendaMensalCentavos > 0) || !(p.taxaMensal > 0) || !(p.prazoMeses > 0)) return { parcelaMaximaCentavos: 0, creditoCentavos: 0, limitadoPeloImovel: false }
  const pmt = (p.rendaMensalCentavos / 100) * frac
  const i = p.taxaMensal
  const pv = (pmt * (1 - Math.pow(1 + i, -p.prazoMeses))) / i
  let credito = Math.round(pv * 100)
  let limitado = false
  if (p.valorImovelCentavos && p.valorImovelCentavos > 0) {
    const teto = Math.round(p.valorImovelCentavos * ltvMaximo(p.produto ?? 'financiamento', cfg))
    if (credito > teto) {
      credito = teto
      limitado = true
    }
  }
  credito = Math.min(credito, cfg.credito_max_centavos)
  return { parcelaMaximaCentavos: Math.round(pmt * 100), creditoCentavos: credito, limitadoPeloImovel: limitado }
}
