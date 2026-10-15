import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

// Um segredo-mestre (DOCUMENTOS_SECRET) gera duas chaves separadas: uma para o código, outra para a sessão.
function chave(rotulo: string): Buffer {
  const mestre = process.env.DOCUMENTOS_SECRET
  if (!mestre || mestre.length < 24) throw new Error('DOCUMENTOS_SECRET ausente ou curto (mínimo 24 caracteres)')
  return createHmac('sha256', mestre).update(rotulo).digest()
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url')

/** Código de 6 dígitos, sorteado com fonte criptográfica. */
export function gerarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** O hash inclui o telefone: o mesmo código em outro número gera outro hash. */
export function hashCodigo(whatsappE164: string, codigo: string): string {
  return createHmac('sha256', chave('codigo')).update(whatsappE164 + ':' + codigo).digest('hex')
}

export function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export interface SessaoDoc {
  lid: string // lead
  exp: number // segundos desde 1970
}

export function assinarSessao(leadId: string, duracaoSeg = 2 * 60 * 60, agora = Date.now()): string {
  const corpo = b64(JSON.stringify({ lid: leadId, exp: Math.floor(agora / 1000) + duracaoSeg } satisfies SessaoDoc))
  const sig = b64(createHmac('sha256', chave('sessao')).update(corpo).digest())
  return corpo + '.' + sig
}

export function verificarSessao(token: string | undefined | null, agora = Date.now()): SessaoDoc | null {
  if (!token) return null
  const [corpo, sig] = token.split('.')
  if (!corpo || !sig) return null
  const esperado = b64(createHmac('sha256', chave('sessao')).update(corpo).digest())
  if (!iguais(sig, esperado)) return null
  try {
    const s = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8')) as SessaoDoc
    if (typeof s.lid !== 'string' || typeof s.exp !== 'number' || s.exp * 1000 < agora) return null
    return s
  } catch {
    return null
  }
}

export const COOKIE_SESSAO = 'big_doc'
export const MAX_TENTATIVAS = 5
