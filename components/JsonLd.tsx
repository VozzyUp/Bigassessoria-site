/** Dados estruturados. O texto vem do nosso código, nunca de entrada de usuário. */
export function JsonLd({ dados }: { dados: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\u003c') }} />
}
