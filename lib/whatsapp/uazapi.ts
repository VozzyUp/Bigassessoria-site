// Adaptador da UAZAPI. Todo o resto do sistema fala só com este módulo.
// ATENÇÃO: o formato exato do webhook e dos endpoints precisa ser conferido na documentação da
// instância do cliente assim que a URL for informada. O parser abaixo é tolerante de propósito.

export type TipoMensagem = 'texto' | 'audio' | 'imagem' | 'documento' | 'video' | 'chamada' | 'outro'

export interface MensagemEntrada {
  id: string
  chatId: string
  /** Número do contato (só dígitos), já sem o sufixo @s.whatsapp.net */
  telefone: string
  fromMe: boolean
  /** true quando a mensagem saiu pela API (nosso sistema); false quando o vendedor digitou no celular */
  viaApi: boolean
  isGroup: boolean
  tipo: TipoMensagem
  texto: string | null
  /** ms desde 1970 */
  timestamp: number
  nome: string | null
}

export type EventoUazapi =
  | { tipo: 'mensagem'; mensagem: MensagemEntrada }
  | { tipo: 'conexao'; conectada: boolean }
  | { tipo: 'ignorado' }

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {})
const str = (v: unknown): string | null => (typeof v === 'string' && v.length ? v : null)

function tipoDe(raw: string | null, texto: string | null): TipoMensagem {
  const t = (raw ?? '').toLowerCase()
  if (t.includes('audio') || t.includes('ptt') || t.includes('voice')) return 'audio'
  if (t.includes('image') || t.includes('sticker')) return 'imagem'
  if (t.includes('video')) return 'video'
  if (t.includes('document')) return 'documento'
  if (t.includes('call')) return 'chamada'
  if (texto) return 'texto'
  return 'outro'
}

export function parseEvento(corpo: unknown): EventoUazapi {
  const b = obj(corpo)
  const evento = (str(b.EventType) ?? str(b.event) ?? str(b.type) ?? '').toLowerCase()

  if (evento.includes('connection') || evento.includes('status')) {
    const inst = obj(b.instance)
    const s = (str(inst.status) ?? str(b.status) ?? '').toLowerCase()
    return { tipo: 'conexao', conectada: s === 'connected' || s === 'open' }
  }

  const m = obj(b.message ?? b.data)
  const chatId = str(m.chatid) ?? str(m.chatId) ?? str(m.remoteJid)
  const id = str(m.messageid) ?? str(m.id) ?? str(m.messageId)
  if (!chatId || !id) return { tipo: 'ignorado' }

  const texto = str(m.text) ?? str(m.content)
  const ts = Number(m.messageTimestamp ?? m.timestamp ?? Date.now())
  return {
    tipo: 'mensagem',
    mensagem: {
      id,
      chatId,
      telefone: chatId.split('@')[0].replace(/\D/g, ''),
      fromMe: m.fromMe === true,
      viaApi: m.wasSentByApi === true,
      isGroup: m.isGroup === true || chatId.endsWith('@g.us'),
      tipo: tipoDe(str(m.messageType) ?? str(m.type), texto),
      texto,
      timestamp: ts < 1e12 ? ts * 1000 : ts,
      nome: str(m.senderName) ?? str(m.pushName),
    },
  }
}

export class ErroUazapi extends Error {}

/** Envia texto por uma instância. `token` é o token da instância (guardado no Vault, nunca em tabela aberta). */
export async function enviarTexto(token: string, telefoneE164: string, texto: string): Promise<string | null> {
  const base = process.env.UAZAPI_BASE_URL
  if (!base) throw new ErroUazapi('UAZAPI_BASE_URL não configurada')
  const res = await fetch(base.replace(/\/$/, '') + '/send/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({ number: telefoneE164.replace(/\D/g, ''), text: texto }),
  })
  if (!res.ok) throw new ErroUazapi('UAZAPI respondeu ' + res.status)
  const j = obj(await res.json().catch(() => ({})))
  return str(j.messageid) ?? str(j.id)
}
