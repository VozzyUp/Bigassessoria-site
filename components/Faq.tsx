import { JsonLd } from './JsonLd'

export interface Pergunta {
  p: string
  r: string
}

export const FAQ_GERAL: Pergunta[] = [
  {
    p: 'O que é crédito com garantia de imóvel?',
    r: 'É um empréstimo em que você oferece um imóvel como garantia. Como o banco tem mais segurança, a taxa costuma ser bem menor que a do cartão, do cheque especial ou do crédito pessoal, e o prazo pode chegar a 240 meses. Você continua com o imóvel e pode seguir morando nele.',
  },
  {
    p: 'Quanto do valor do imóvel posso receber?',
    r: 'No crédito com garantia de imóvel, até 60% do valor avaliado. No financiamento para comprar um imóvel, até 80%. O valor final depende da avaliação do imóvel e da análise de crédito do banco.',
  },
  {
    p: 'A taxa que aparece no simulador é a taxa final?',
    r: 'Não. A taxa de 1,19% ao mês é a partir de, para o melhor perfil. A taxa real é definida pelo banco depois da análise do seu perfil e do imóvel. Depois da sua simulação, a Big compara as propostas dos bancos parceiros e mostra as condições reais.',
  },
  {
    p: 'A parcela do simulador já inclui seguros e correção pelo IPCA?',
    r: 'Não. A simulação mostra a parcela sem a correção pelo IPCA, seguros, tarifas e impostos. Esses custos aparecem na proposta do banco.',
  },
  {
    p: 'Em quais estados a Big Assessoria atende?',
    r: 'Atendemos imóveis em Minas Gerais, São Paulo, Mato Grosso do Sul, Mato Grosso, Paraná, Santa Catarina, Rio Grande do Sul, Rio de Janeiro e Espírito Santo.',
  },
  {
    p: 'Quais documentos preciso enviar?',
    r: 'Documento pessoal, comprovante de residência, comprovantes de renda, matrícula atualizada e IPTU do imóvel. Se o imóvel for financiado, também o extrato do saldo devedor. Você envia tudo por um canal seguro, com um código que recebe no WhatsApp.',
  },
  {
    p: 'A simulação me obriga a contratar?',
    r: 'Não. A simulação é gratuita e sem compromisso. Você só segue em frente se gostar das propostas.',
  },
]

export function Faq({ itens = FAQ_GERAL, titulo = 'Perguntas frequentes' }: { itens?: Pergunta[]; titulo?: string }) {
  return (
    <section className="band" aria-labelledby="faq-t">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow">Dúvidas</p>
          <h2 id="faq-t">{titulo}</h2>
        </div>
        <div className="faq">
          {itens.map((i) => (
            <details key={i.p}>
              <summary>{i.p}</summary>
              <p>{i.r}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: itens.map((i) => ({ '@type': 'Question', name: i.p, acceptedAnswer: { '@type': 'Answer', text: i.r } })),
        }}
      />
    </section>
  )
}
