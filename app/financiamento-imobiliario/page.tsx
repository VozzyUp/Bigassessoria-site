import type { Metadata } from 'next'
import { ProdutoPage } from '@/components/ProdutoPage'

export const metadata: Metadata = {
  title: 'Financiamento imobiliário: simule e compare bancos',
  description:
    'Financie até 80% do valor do imóvel. Simule a parcela no Price ou no SAC e deixe a Big Assessoria comparar as propostas dos bancos parceiros para você.',
  alternates: { canonical: '/financiamento-imobiliario' },
}

export default function Page() {
  return (
    <ProdutoPage
      d={{
        rota: '/financiamento-imobiliario',
        produto: 'financiamento',
        eyebrow: 'Financiamento imobiliário',
        titulo: <>Compre o seu imóvel <em>com a melhor proposta entre os bancos.</em></>,
        lead: 'Financiamento de até 80% do valor do imóvel. A Big compara as condições dos bancos parceiros e conduz o processo, da análise ao registro.',
        beneficios: [
          'Simule a parcela no Price ou no SAC e veja a diferença',
          'Acompanhamento de um especialista em cada etapa',
          'Documentos enviados por um canal seguro, sem fila nem papelada',
        ],
      }}
    />
  )
}
