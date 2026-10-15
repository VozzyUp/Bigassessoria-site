// Ícones próprios (traço simples, estilo Lucide). Mantidos aqui para não carregar uma biblioteca inteira.
type Props = { nome: keyof typeof CAMINHOS; tamanho?: number; className?: string }

const CAMINHOS = {
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  key: (<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l3 3M14 9l2 2" /></>),
  down: (<><path d="M3 7l6 6 4-4 8 8" /><path d="M15 17h6v-6" /></>),
  cal: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  map: (<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  bank: <path d="M3 9 12 4l9 5M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18" />,
  shield: (<><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>),
} as const

export function Icone({ nome, tamanho = 20, className }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {CAMINHOS[nome]}
    </svg>
  )
}

export function IconeWhatsApp({ tamanho = 24 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.7-.3z" />
    </svg>
  )
}

/** Marca da Big: casa + cifrão. Versão flat proposta (vetorial); trocar pelo SVG oficial quando o cliente enviar. */
export function MarcaBig({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="currentColor" d="M24 4 3 21.5c-.9.8-.3 2.3.9 2.3H8V41a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3V23.8h4.1c1.2 0 1.8-1.5.9-2.3L37 15.2V8.5a1.5 1.5 0 0 0-1.5-1.5h-2A1.5 1.5 0 0 0 32 8.5v2.5z" />
      <path fill="var(--accent)" d="M25.6 15.5h-3.2v2.6c-3.4.6-5.6 2.9-5.6 5.9 0 3.6 2.8 4.9 6 5.7 2.4.6 3.1 1.1 3.1 2.1 0 1.1-1.1 1.8-2.9 1.8-2 0-3.4-.9-4-2.6l-3.1 1.6c.9 2.5 3.1 4 6.5 4.4V40h3.2v-3c3.5-.6 5.8-2.8 5.8-6 0-3.5-2.6-4.9-6.1-5.7-2.3-.6-3-1-3-2 0-.9.9-1.6 2.5-1.6 1.7 0 2.8.7 3.3 2.1l3-1.6c-.8-2.1-2.6-3.6-5.5-4z" />
    </svg>
  )
}
