import type { MetadataRoute } from 'next'
import { ARTIGOS } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const fixas = ['/', '/credito-com-garantia-de-imovel', '/financiamento-imobiliario', '/portabilidade-de-financiamento', '/sobre', '/contato', '/perguntas-frequentes', '/blog']
  return [
    ...fixas.map((r) => ({ url: site + r, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: r === '/' ? 1 : 0.8 })),
    ...ARTIGOS.map((a) => ({ url: site + '/blog/' + a.slug, lastModified: new Date(a.publicadoEm), changeFrequency: 'yearly' as const, priority: 0.6 })),
  ]
}
