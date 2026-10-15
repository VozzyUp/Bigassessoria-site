// Regras do agente de IA que não dependem de modelo: horário, limites e proteção contra respostas proibidas.

export interface Horario {
  tz: string
  dias: number[] // 0 = domingo ... 6 = sábado
  inicio: string // "08:30"
  fim: string
  sabado?: { inicio: string; fim: string }
}

export const HORARIO_PADRAO: Horario = {
  tz: 'America/Sao_Paulo',
  dias: [1, 2, 3, 4, 5],
  inicio: '08:30',
  fim: '18:00',
  sabado: { inicio: '09:00', fim: '12:00' },
}

const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Está dentro do horário de atendimento? Usa o fuso configurado (padrão: Brasília). */
export function dentroDoHorario(h: Horario, agora = new Date()): boolean {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: h.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(agora)
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? ''
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  const hora = Number(get('hour')) % 24
  const atual = hora * 60 + Number(get('minute'))
  if (dia === 6 && h.sabado) return atual >= minutos(h.sabado.inicio) && atual < minutos(h.sabado.fim)
  if (!h.dias.includes(dia)) return false
  return atual >= minutos(h.inicio) && atual < minutos(h.fim)
}

export interface EstadoParaResponder {
  globalAtivo: boolean
  instanciaAtiva: boolean
  conversaAtiva: boolean
  msgsEnviadas: number
  maxMsgs: number
  fromMeRecente: boolean // o vendedor escreveu pelo celular depois da última mensagem do cliente
}

export type Decisao = { responder: true } | { responder: false; motivo: string }

export function deveResponder(e: EstadoParaResponder): Decisao {
  if (!e.globalAtivo) return { responder: false, motivo: 'agente desligado (geral)' }
  if (!e.instanciaAtiva) return { responder: false, motivo: 'agente desligado neste número' }
  if (!e.conversaAtiva) return { responder: false, motivo: 'agente desligado nesta conversa' }
  if (e.fromMeRecente) return { responder: false, motivo: 'vendedor assumiu a conversa' }
  if (e.msgsEnviadas >= e.maxMsgs) return { responder: false, motivo: 'limite de mensagens antes de chamar humano' }
  return { responder: true }
}

/** Atraso aleatório (ms) para parecer atendimento humano e proteger o número. */
export function atrasoHumano([min, max]: [number, number], aleatorio = Math.random): number {
  return Math.round((min + aleatorio() * Math.max(0, max - min)) * 1000)
}

const PROIBIDO: { re: RegExp; porque: string }[] = [
  { re: /\b(aprova(ção|cao) (garantida|certa|assegurada)|garanto (a )?aprova|100% aprovad|sem consulta ao (spc|serasa))/i, porque: 'promete aprovação' },
  { re: /(taxa|juros?) (final|definitiv[ao]|fechad[ao]).{0,12}(é|será|vai ser|fica)/i, porque: 'afirma taxa final' },
  { re: /\b(me (envie|mande|passe)|envie (aqui|por aqui)|mande (aqui|por aqui)).{0,40}\b(cpf|rg|cnh|senha|cart[ãa]o|documento|comprovante|foto do)/i, porque: 'pede dado sensível no chat' },
  { re: /\b(sou|sou um|sou uma) (humano|pessoa|atendente real)\b/i, porque: 'finge ser humano' },
]

/** Devolve o motivo se a resposta do modelo quebra uma regra de segurança; null se está liberada. */
export function violaRegras(texto: string): string | null {
  for (const r of PROIBIDO) if (r.re.test(texto)) return r.porque
  return null
}

/** Tira markdown e limita o tamanho: WhatsApp não renderiza **negrito** do jeito do modelo. */
export function limparResposta(texto: string, max = 900): string {
  const t = texto
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-•]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t
}
