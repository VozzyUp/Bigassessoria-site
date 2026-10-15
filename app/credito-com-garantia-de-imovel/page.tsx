import type { Metadata } from 'next'
import { ProdutoPage } from '@/components/ProdutoPage'

export const metadata: Metadata = {
  title: 'Crédito com garantia de imóvel (home equity) a partir de 1,19% a.m.',
  description:
    'Use seu imóvel como garantia e consiga crédito com taxa de financiamento imobiliário, até 240 meses para pagar. Simule a parcela e compare propostas de bancos parceiros.',
  alternates: { canonical: '/credito-com-garantia-de-imovel' },
}

// a taxa e os limites vêm do painel: a página se atualiza sozinha a cada 5 minutos
export const revalidate = 300

export default function Page() {
  return (
    <ProdutoPage
      d={{
        rota: '/credito-com-garantia-de-imovel',
        produto: 'home_equity',
        eyebrow: 'Home equity',
        titulo: <>Crédito com garantia de imóvel, <em>com taxa de crédito imobiliário.</em></>,
        lead: 'Libere até 60% do valor do seu imóvel para o seu negócio, para quitar dívidas caras ou para reformar. Você continua morando no imóvel e paga em até 240 meses.',
        beneficios: [
          'Taxas a partir de 1,19% ao mês, bem abaixo do cartão e do cheque especial',
          'Até 240 meses para pagar, com carência de até 90 dias',
          'Propostas de vários bancos com uma única análise',
        ],
      }}
    />
  )
}
