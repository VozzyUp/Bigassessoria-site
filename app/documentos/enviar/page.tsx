import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { admin } from '@/lib/supabase/admin'
import { sessaoDoCliente } from '@/lib/documentos/sessao-http'
import { Enviar, type Item, type Dados } from './Enviar'

export const metadata: Metadata = { title: 'Enviar documentos', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type Tipo = { chave: string; nome: string; grupo: string; obrigatorio: boolean; so_se_financiado: boolean; ordem: number }

export default async function Page() {
  const sessao = await sessaoDoCliente()
  if (!sessao) redirect('/documentos')
  const db = admin()

  const [{ data: lead }, { data: itens }, { data: dados }] = await Promise.all([
    db.from('leads').select('nome').eq('id', sessao.lid).maybeSingle(),
    db.from('documento_itens').select('status, motivo_rejeicao, arquivos, documento_tipos(chave, nome, grupo, obrigatorio, so_se_financiado, ordem)').eq('lead_id', sessao.lid),
    db.from('dados_cadastrais').select('cpf, data_nascimento, estado_civil, profissao, endereco, conjuge, imovel').eq('lead_id', sessao.lid).maybeSingle(),
  ])

  const lista: Item[] = (itens ?? [])
    .map((i) => {
      const t = (Array.isArray(i.documento_tipos) ? i.documento_tipos[0] : i.documento_tipos) as Tipo | null
      return t ? { ...t, status: i.status as Item['status'], motivo: i.motivo_rejeicao as string | null, qtd: (i.arquivos ?? []).length } : null
    })
    .filter((x): x is Item => !!x)
    .sort((a, b) => a.ordem - b.ordem)

  return (
    <>
      <Header />
      <main id="conteudo" className="band">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <p className="eyebrow">Envio seguro</p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,36px)', lineHeight: 1.15, color: 'var(--brand-strong)', fontWeight: 800, marginTop: 8 }}>
            {lead?.nome ? 'Olá, ' + lead.nome.split(' ')[0] + '. ' : ''}Envie seus documentos
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '12px 0 28px' }}>
            Complete seus dados e envie os documentos abaixo. Aceitamos PDF e foto (JPG, PNG ou HEIC) de até 10 MB. Você pode usar a câmera do celular.
          </p>
          <Enviar itens={lista} dados={(dados ?? null) as Dados | null} />
        </div>
      </main>
      <Footer />
    </>
  )
}
