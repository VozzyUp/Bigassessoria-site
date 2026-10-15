import type { Metadata } from 'next'
import { ProdutoPage } from '@/components/ProdutoPage'

export const metadata: Metadata = {
  title: 'Portabilidade de financiamento: pague menos na parcela',
  description:
    'Já tem um financiamento imobiliário? Leve o saldo devedor para outro banco com condições melhores e reduza a parcela. Simule e fale com um especialista.',
  alternates: { canonical: '/portabilidade-de-financiamento' },
}

// a taxa e os limites vêm do painel: a página se atualiza sozinha a cada 5 minutos
export const revalidate = 300

export default function Page() {
  return (
    <ProdutoPage
      d={{
        rota: '/portabilidade-de-financiamento',
        produto: 'home_equity',
        eyebrow: 'Portabilidade',
        titulo: <>Pague menos no seu financiamento <em>sem trocar de imóvel.</em></>,
        lead: 'Leve o saldo do seu financiamento para um banco com taxa melhor. A Big compara as condições e cuida da burocracia da troca.',
        beneficios: [
          'Parcela menor ou prazo mais curto, conforme o seu objetivo',
          'Sem custo de entrada para a análise inicial',
          'Troca feita pelo banco novo, sem você precisar negociar com o antigo',
        ],
      }}
    />
  )
}
