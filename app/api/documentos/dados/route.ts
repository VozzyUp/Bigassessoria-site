import { NextResponse } from 'next/server'
import { z } from 'zod'
import { admin, ErroConfig } from '@/lib/supabase/admin'
import { sessaoDoCliente } from '@/lib/documentos/sessao-http'
import { cpfValido, soDigitos } from '@/lib/documentos/cpf'

const texto = (max: number) => z.string().trim().max(max)
const corpo = z.object({
  cpf: z.string().refine(cpfValido, 'cpf_invalido'),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estadoCivil: z.enum(['solteiro', 'casado', 'uniao_estavel', 'divorciado', 'viuvo', 'separado']),
  profissao: texto(120).min(2),
  endereco: z.object({
    cep: texto(10),
    logradouro: texto(160),
    numero: texto(20),
    complemento: texto(80).optional(),
    bairro: texto(80),
    cidade: texto(80),
    uf: z.string().length(2),
  }),
  conjuge: z.object({ nome: texto(120), cpf: z.string().refine(cpfValido, 'cpf_invalido') }).optional(),
  imovel: z.object({ endereco: texto(240), matricula: texto(40).optional(), cartorio: texto(120).optional() }),
})

export async function PUT(req: Request) {
  const sessao = await sessaoDoCliente()
  if (!sessao) return NextResponse.json({ erro: 'sessao_expirada' }, { status: 401 })
  const p = corpo.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ erro: 'dados_invalidos', campos: p.error.flatten().fieldErrors }, { status: 400 })
  const d = p.data
  try {
    const { error } = await admin().from('dados_cadastrais').upsert({
      lead_id: sessao.lid,
      cpf: soDigitos(d.cpf),
      data_nascimento: d.dataNascimento,
      estado_civil: d.estadoCivil,
      profissao: d.profissao,
      endereco: d.endereco,
      conjuge: d.conjuge ? { nome: d.conjuge.nome, cpf: soDigitos(d.conjuge.cpf) } : null,
      imovel: d.imovel,
    })
    if (error) throw error
    await admin().from('audit_log').insert({ lead_id: sessao.lid, ator: 'cliente', acao: 'dados.salvos' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ErroConfig) return NextResponse.json({ erro: 'servidor_nao_configurado' }, { status: 503 })
    console.error('PUT /api/documentos/dados', e)
    return NextResponse.json({ erro: 'erro_interno' }, { status: 500 })
  }
}
