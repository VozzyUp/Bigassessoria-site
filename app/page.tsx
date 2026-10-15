import { ProdutoPage } from '@/components/ProdutoPage'

// a taxa e os limites vêm do painel: a página se atualiza sozinha a cada 5 minutos
export const revalidate = 300

export default function Home() {
  return (
    <ProdutoPage
      d={{
        rota: '/',
        produto: 'home_equity',
        eyebrow: 'Crédito com garantia de imóvel',
        titulo: <>Seu imóvel vale mais do que você imagina. <em>Use-o a seu favor.</em></>,
        lead: 'Taxas a partir de 1,19% ao mês e até 240 meses para pagar. Comparamos as propostas dos bancos parceiros e acompanhamos você até o dinheiro cair na conta.',
        beneficios: [
          'Crédito de até 60% do valor do imóvel',
          'O imóvel continua sendo seu e você segue morando nele',
          'Uma análise, vários bancos: você escolhe a melhor proposta',
        ],
      }}
    />
  )
}
