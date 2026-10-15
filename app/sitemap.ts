import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const rotas = ['/', '/credito-com-garantia-de-imovel', '/financiamento-imobiliario', '/portabilidade-de-financiamento']
  return rotas.map((r) => ({ url: site + r, lastModified: new Date(), changeFrequency: 'monthly', priority: r === '/' ? 1 : 0.8 }))
}
