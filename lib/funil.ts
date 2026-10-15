export const ETAPAS = [
  { id: 'novo', nome: 'Novo lead' },
  { id: 'em_atendimento', nome: 'Em atendimento' },
  { id: 'qualificado', nome: 'Qualificado' },
  { id: 'documentacao', nome: 'Documentação' },
  { id: 'analise', nome: 'Análise no banco' },
  { id: 'proposta', nome: 'Proposta' },
  { id: 'contrato', nome: 'Contrato' },
  { id: 'liberado', nome: 'Liberado' },
  { id: 'perdido', nome: 'Perdido' },
] as const

export type EtapaId = (typeof ETAPAS)[number]['id']
export const NOME_ETAPA: Record<string, string> = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nome]))

export const MOTIVOS_PERDA = [
  { id: 'taxa', nome: 'Taxa' },
  { id: 'desistencia', nome: 'Desistência' },
  { id: 'reprovacao', nome: 'Reprovação' },
  { id: 'sem_retorno', nome: 'Sem retorno' },
  { id: 'fora_regiao', nome: 'Fora da região' },
  { id: 'sem_garantia', nome: 'Sem imóvel de garantia' },
  { id: 'outro', nome: 'Outro' },
] as const

export type Temperatura = 'frio' | 'morno' | 'quente'
export function temperaturaDe(t: number | null): Temperatura | null {
  if (t === null || t === undefined) return null
  return t >= 70 ? 'quente' : t >= 40 ? 'morno' : 'frio'
}
