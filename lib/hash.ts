import 'server-only'
import { createHash } from 'node:crypto'

export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  return createHash('sha256').update((process.env.HASH_SALT ?? '') + ip).digest('hex').slice(0, 32)
}

export function ipDe(req: Request): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip')
}
