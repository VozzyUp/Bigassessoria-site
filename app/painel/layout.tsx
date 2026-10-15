import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } }

export default function PainelLayout({ children }: LayoutProps<'/painel'>) {
  return <div style={{ minHeight: '100dvh', background: 'var(--surface)' }}>{children}</div>
}
