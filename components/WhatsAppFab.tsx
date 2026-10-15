import { IconeWhatsApp } from './Icone'

/** Botão flutuante. Passa pelo link rastreável /w/site-flutuante para registrar o clique e a origem. */
export function WhatsAppFab() {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- é um redirect de servidor para o WhatsApp; Link tentaria pré-carregar e contaria cliques falsos
    <a className="fab" href="/w/site-flutuante" aria-label="Falar com a Big Assessoria no WhatsApp">
      <IconeWhatsApp />
      <span>Fale conosco</span>
    </a>
  )
}
