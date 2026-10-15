import { JsonLd } from './JsonLd'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const UFS = ['MG', 'SP', 'MS', 'MT', 'PR', 'SC', 'RS', 'RJ', 'ES']

/** Organização + serviço financeiro. Sem endereço residencial: só cidade/UF e a área atendida. */
export function Organizacao() {
  return (
    <JsonLd
      dados={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FinancialService',
            '@id': SITE + '/#org',
            name: 'Big Assessoria',
            legalName: 'B.I.G. Soluções Imobiliárias LTDA',
            url: SITE,
            foundingDate: '2015-04-22',
            taxID: '22.309.209/0001-74',
            description: 'Consultoria e representação de bancos parceiros em crédito com garantia de imóvel, financiamento imobiliário e portabilidade.',
            address: { '@type': 'PostalAddress', addressLocality: 'Ijuí', addressRegion: 'RS', addressCountry: 'BR' },
            areaServed: UFS.map((uf) => ({ '@type': 'AdministrativeArea', name: uf, containedInPlace: { '@type': 'Country', name: 'Brasil' } })),
          },
          { '@type': 'WebSite', '@id': SITE + '/#site', url: SITE, name: 'Big Assessoria', inLanguage: 'pt-BR', publisher: { '@id': SITE + '/#org' } },
        ],
      }}
    />
  )
}
