import { z } from 'zod'

export const atribuicaoSchema = z.object({
  visitanteId: z.string().max(64).optional(),
  landing: z.string().max(500).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  gclid: z.string().max(200).optional(),
  gbraid: z.string().max(200).optional(),
  wbraid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(200).optional(),
  primeiroToque: z.record(z.string(), z.unknown()).optional(),
})
export type Atribuicao = z.infer<typeof atribuicaoSchema>
