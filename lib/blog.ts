// Artigos do blog. Texto informativo e neutro: não promete taxa, prazo nem aprovação.
// Formato do corpo: cada item é um parágrafo; linhas que começam com "## " viram subtítulo; "- " vira item de lista.
// RASCUNHO para revisão do cliente antes de publicar com tráfego pago.

export interface Artigo {
  slug: string
  titulo: string
  descricao: string
  publicadoEm: string // AAAA-MM-DD
  minutos: number
  corpo: string[]
}

export const ARTIGOS: Artigo[] = [
  {
    slug: 'o-que-e-home-equity',
    titulo: 'O que é home equity e como funciona o crédito com garantia de imóvel',
    descricao: 'Entenda como funciona o empréstimo com garantia de imóvel, quanto dá para pegar, quais são os riscos e quando vale a pena.',
    publicadoEm: '2026-10-15',
    minutos: 4,
    corpo: [
      'Home equity é o nome dado ao crédito em que você usa um imóvel seu como garantia. Como o banco tem uma garantia forte, a taxa costuma ser bem menor que a do cartão de crédito, do cheque especial ou do empréstimo pessoal, e o prazo pode ser muito mais longo.',
      '## Como funciona',
      'Você escolhe um imóvel, que pode estar quitado ou ainda com saldo em aberto, e o banco avalia o valor dele. Sobre essa avaliação, libera uma parte em dinheiro. No Brasil, a garantia é registrada na matrícula do imóvel por meio da alienação fiduciária. Você continua morando ou usando o imóvel normalmente e, quando termina de pagar, a garantia é baixada.',
      '## Quanto dá para pegar',
      'Cada banco tem a sua regra, mas o limite costuma ficar em uma parte do valor do imóvel, geralmente em torno de 60%. O valor final depende da avaliação do imóvel, da sua renda e da análise de crédito.',
      '## Para que serve',
      '- Capital de giro ou expansão de uma empresa',
      '- Quitar dívidas caras, como cartão e cheque especial',
      '- Reforma ou construção',
      '- Comprar outro imóvel ou um bem de maior valor',
      '## Pontos de atenção',
      'A parcela costuma ser corrigida por um índice de inflação, como o IPCA, além dos juros. Também existem seguros, tarifas e custos de cartório e avaliação. Por isso, compare sempre o custo efetivo total (CET) das propostas, e não só a taxa de juros.',
      'Como o imóvel é a garantia, deixar de pagar pode levar à perda dele, depois de um processo previsto em lei. Faça as contas com calma e só contrate se a parcela couber no seu orçamento com folga.',
      '## Como a Big Assessoria ajuda',
      'A Big compara as condições de bancos parceiros para o seu caso e acompanha o processo até o crédito cair na conta. A simulação é gratuita e não obriga a contratar.',
    ],
  },
  {
    slug: 'home-equity-ou-emprestimo-pessoal',
    titulo: 'Home equity ou empréstimo pessoal: qual compensa mais?',
    descricao: 'Compare custo, prazo, garantia e risco entre o crédito com garantia de imóvel e o empréstimo pessoal, e veja qual faz mais sentido para você.',
    publicadoEm: '2026-10-15',
    minutos: 4,
    corpo: [
      'Na hora de pegar dinheiro, a pergunta mais comum é qual modalidade sai mais barata. A resposta depende do que você tem para oferecer em garantia e do prazo de que precisa.',
      '## Custo',
      'O empréstimo pessoal não tem garantia, então o banco cobra mais para compensar o risco. O crédito com garantia de imóvel tem taxa menor porque o imóvel protege o banco. Em geral, essa diferença é grande, e é por isso que o home equity é muito usado para trocar dívidas caras por uma dívida mais barata.',
      '## Prazo e parcela',
      'O home equity costuma oferecer prazos longos, de vários anos, o que reduz o valor da parcela. O empréstimo pessoal tem prazos mais curtos, e a parcela pesa mais no mês.',
      '## Risco',
      'No empréstimo pessoal, o risco de não pagar é negativar o nome e pagar juros e multas. No home equity, além disso, o imóvel dado em garantia pode ser retomado depois do processo previsto em lei. Esse é o principal ponto de atenção.',
      '## Burocracia e tempo',
      'O empréstimo pessoal é rápido e quase sem papelada. O home equity exige avaliação do imóvel, matrícula atualizada e registro da garantia em cartório, o que leva mais tempo.',
      '## Quando cada um faz sentido',
      '- Precisa de um valor pequeno e rápido, sem imóvel disponível: empréstimo pessoal.',
      '- Precisa de um valor maior, prazo longo e tem imóvel: home equity.',
      '- Quer quitar várias dívidas caras de uma vez: compare o custo efetivo total das duas opções.',
      'Compare sempre o CET, que reúne juros, seguros e tarifas, e não apenas a taxa mensal. A simulação da Big é gratuita e mostra a parcela estimada no Price e no SAC.',
    ],
  },
  {
    slug: 'portabilidade-de-financiamento-imobiliario',
    titulo: 'Portabilidade de financiamento imobiliário: quando vale a pena',
    descricao: 'Saiba como funciona a portabilidade do financiamento do imóvel, o que precisa ser comparado e em quais situações a troca de banco compensa.',
    publicadoEm: '2026-10-15',
    minutos: 4,
    corpo: [
      'A portabilidade permite levar o saldo devedor do seu financiamento imobiliário para outro banco que ofereça condições melhores. Você não muda de imóvel nem refaz o contrato de compra: o banco novo quita a dívida no antigo e passa a ser o credor.',
      '## Quando costuma valer a pena',
      '- A taxa do banco novo é menor que a do contrato atual.',
      '- Você quer reduzir a parcela ou encurtar o prazo.',
      '- As taxas de mercado caíram desde que você contratou.',
      '- Você quer trocar os seguros ou os pacotes de serviços por opções mais baratas.',
      '## O que comparar',
      'Olhe o custo efetivo total (CET) das duas propostas, não só a taxa. Confira também o saldo devedor, o prazo restante, o sistema de amortização (Price ou SAC), os seguros e eventuais custos de registro. Uma taxa menor com prazo muito maior pode sair mais cara no total.',
      '## Como funciona na prática',
      'O banco novo faz uma análise de crédito e uma avaliação do imóvel, apresenta a proposta e pede ao banco atual o saldo devedor. O banco atual tem um prazo para tentar cobrir a oferta. Se você decidir seguir, o banco novo quita a dívida e registra a nova garantia.',
      '## E se eu quiser pegar dinheiro a mais?',
      'Em alguns casos, é possível combinar a portabilidade com um crédito adicional, aproveitando o valor que o imóvel já tem de folga. Isso depende das regras de cada banco.',
      'A Big Assessoria compara as condições dos bancos parceiros para o seu financiamento e conduz o processo. Faça uma simulação gratuita e sem compromisso.',
    ],
  },
  {
    slug: 'documentos-para-financiar-um-imovel',
    titulo: 'Documentos para financiar um imóvel ou pedir crédito com garantia',
    descricao: 'Lista dos documentos mais pedidos pelos bancos para financiamento imobiliário e crédito com garantia de imóvel, e como se organizar.',
    publicadoEm: '2026-10-15',
    minutos: 3,
    corpo: [
      'Ter os documentos em ordem acelera a análise do banco e evita idas e vindas. A lista varia de banco para banco, mas estes são os itens mais pedidos.',
      '## Documentos pessoais',
      '- RG ou CNH e CPF',
      '- Certidão de estado civil (nascimento, casamento ou união estável) e dados do cônjuge, se houver',
      '- Comprovante de residência recente',
      '## Comprovação de renda',
      '- Trabalhador com carteira assinada: últimos holerites e declaração de imposto de renda',
      '- Autônomo ou empresário: declaração de imposto de renda, extratos bancários e documentos da empresa, como pró-labore e faturamento',
      '## Documentos do imóvel',
      '- Matrícula atualizada, com a certidão de ônus reais',
      '- Carnê ou capa do IPTU',
      '- Se o imóvel ainda está financiado: extrato do saldo devedor',
      '- Documentos do condomínio, quando for o caso',
      '## Dicas',
      'Peça a matrícula atualizada no cartório de registro de imóveis antes de começar, porque ela costuma levar alguns dias. Confira se o nome e o estado civil nos documentos estão iguais e atualizados. Guarde tudo em PDF ou em fotos nítidas.',
      'Quando o seu atendimento na Big Assessoria avança, você recebe um código no WhatsApp e envia os documentos por um canal seguro, sem mandar nada sensível pelo chat.',
    ],
  },
]

export const artigoPorSlug = (slug: string) => ARTIGOS.find((a) => a.slug === slug)
