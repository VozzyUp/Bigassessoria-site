# Design system: Big Assessoria

Fonte: `tokens.json` (gera `tokens.css` e `tailwind.css`). Contraste: 31 pares, 0 falhas AA.
Base dos componentes: shadcn/ui (Radix) + Tailwind. Ícones: **Lucide** (MIT). Fotos: banco licenciado
(Unsplash/Pexels) ou produção própria. Nada da ZAFF nem do concorrente.

## Direção visual

- **Marca do cliente mantida:** navy `#37495D` (medido no logo) é a cor de marca: header, títulos e seções
  escuras. O cinza do logo `#9E9E9E` dá 2,68:1 em fundo branco: **só no logo**, nunca em texto.
- **Accent âmbar `#F5A524`** só para a ação principal (simular, falar com especialista) e para os números do
  simulador em fundo escuro. Contraste forte com o navy, lembra "valor/patrimônio" e se diferencia do verde
  do concorrente. Texto sobre âmbar é sempre escuro (`on-accent`, 8,96:1).
- **WhatsApp** usa o verde oficial do WhatsApp só no botão de WhatsApp.
- **Tipografia:** Plus Jakarta Sans 800 nos títulos e números (eco do "BIG" pesado do logo), Inter no texto.
  Ambas OFL, servidas localmente por `next/font`.
- **Tom:** confiável e direto, com respiro. Seções alternam branco / `surface` / navy escuro (`brand-strong`).
  O simulador fica num card escuro, que é o elemento mais forte da página.
- **Logo:** é do cliente. Pedir o arquivo vetorial (SVG/AI). O "$" em 3D está datado e não escala bem em
  favicon e no header mobile: proposta para aprovação é uma versão flat (casa navy + "$" em âmbar ou branco),
  mantendo o desenho. Até lá, usar o logo atual em PNG com fundo transparente.

## Layout

| item | valor |
| --- | --- |
| largura máx. do conteúdo | 1200 px; texto corrido 720 px |
| gutter | 16 px no mobile, 24 px no desktop |
| header | 72 px (60 px no mobile), fixo, fica sólido com sombra ao rolar |
| grid | 12 colunas no desktop, 4 no mobile |
| breakpoints | 640 / 768 / 1024 / 1280 |
| ritmo vertical das seções | 64 px mobile, 96 px desktop |
| painel | sidebar 248 px (vira drawer < 1024 px), conteúdo fluido |

## Componentes

```
Button
  variants  primary (accent), brand (navy), secondary (contorno navy), ghost, whatsapp, danger
  sizes     sm 36px, md 44px, lg 52px (CTA do hero e do simulador)
  states    default, hover (accent-hover / brand-strong), active (translate 1px), focus-visible
            (anel 2px focus, offset 2px), disabled (opacidade 50%, sem hover), loading (spinner + label mantido)
  tokens    primary: bg accent, text on-accent; brand: bg brand, text on-brand; radius md; font sm-base/700
  a11y      <button> ou <a> de verdade; alvo mínimo 44px; loading com aria-busy e o texto ainda legível
            para leitor de tela; ícone sozinho exige aria-label
  used on   todas

WhatsAppFab (botão flutuante)
  variants  só ícone (mobile), ícone + "Fale conosco" (desktop)
  states    default, hover, focus-visible, oculto enquanto o teclado do celular está aberto
  tokens    bg whatsapp, text on-whatsapp, shadow pop, radius pill
  behavior  abre /w/site-flutuante (rastreado); some na página /documentos e no painel
  a11y      aria-label "Falar com a Big Assessoria no WhatsApp"
  used on   site público

Header / Nav
  variants  transparente sobre o hero escuro, sólido (bg) ao rolar; mobile com drawer
  states    link default, hover, ativo (sublinhado accent 2px), drawer aberto (foco preso, Esc fecha)
  content   logo, Home equity, Financiamento, Portabilidade, Como funciona, Blog, Sobre; CTA "Simular"
  a11y      <nav aria-label="Principal">, link "Pular para o conteúdo", drawer com Radix Dialog
  used on   site público

Footer
  content   logo, resumo, links, contato (WhatsApp, e-mail), cidades (Ijuí/RS, Porto Alegre/RS,
            Joinville/SC), CNPJ 22.309.209/0001-74, razão social, "desde 2015", aviso legal de crédito,
            privacidade, termos, preferências de cookies
  tokens    bg dark-bg, text dark-text, links dark-text-muted → dark-text no hover
  used on   site público

Hero
  variants  home (título + subtítulo + mini simulador), produto (título + benefícios + simulador),
            artigo (título + meta)
  tokens    bg brand-strong com gradiente sutil para brand, título font-display text-display on-brand,
            destaque em accent
  rule      o mini simulador fica acima da dobra no desktop e logo abaixo do título no mobile
  used on   S10, S11, S12, S13, S20

IntentSelector (o que você quer fazer)
  variants  3 cards: Crédito com garantia de imóvel, Comprar um imóvel, Baixar a parcela (portabilidade)
            + link "Falar com um especialista"
  states    default, hover (sobe 2px, shadow raised), focus-visible, selecionado (borda accent 2px)
  a11y      grupo de radio (role radiogroup) quando escolhe o modo do simulador; links quando navega
  used on   S10

Simulador (card)
  structure produto (tabs) → valor do imóvel → valor do crédito (com limite pelo LTV) → sistema
            (Price | SAC) → taxa (chips + campo) → prazo (chips) → carência (chips) → resultado → CTA
  tokens    bg dark-surface, borda dark-border, labels dark-text-muted, números accent font-display
            text-number, chips: default bg dark-bg / selecionado bg accent text on-accent
  states    vazio (com valores padrão), editando, fora do limite (mensagem warning no campo + CTA mantido),
            UF fora da região (aviso + segue capturando), recalculando (sem spinner: é instantâneo),
            resultado, enviando o lead (loading), erro de envio (danger + tentar de novo)
  result    "Parcela estimada em 240x: R$ 6.319,54/mês", linha "1,19% a.m. + IPCA · Price",
            Price e SAC lado a lado (SAC: 1ª e última), aviso legal sempre visível abaixo
  a11y      cada grupo de chips é radiogroup com setas; o resultado fica num aria-live="polite";
            campos com label visível, nunca só placeholder
  used on   S10, S11, S12, S13, S14, S20 (embutido)

Chip (seleção)
  variants  radio (um por vez), toggle
  sizes     md 44px de altura
  states    default, hover, selecionado, focus-visible, disabled
  tokens    claro: bg surface, borda border / selecionado bg brand text on-brand;
            escuro: bg dark-bg / selecionado bg accent text on-accent
  used on   simulador, filtros do painel

MoneyInput (R$)
  behavior  máscara BRL ao digitar, aceita colar "500.000" ou "500 mil", teclado numérico no mobile
            (inputmode="numeric"), guarda em centavos
  states    vazio, focado, preenchido, erro (borda danger + mensagem abaixo, aria-describedby), disabled
  tokens    borda border-input, radius md, altura 52px, valor font-display xl
  used on   simulador, formulário de lead

PhoneInput (WhatsApp)
  behavior  máscara (DD) 9XXXX-XXXX, valida DDD brasileiro, normaliza para E.164
  states    como MoneyInput
  used on   lead, documentos

TextField / Select / Textarea / Checkbox
  states    default, hover, focus-visible, erro, disabled; select de cidade desabilitado até a UF
  rule      label sempre visível; ajuda abaixo em text-muted; erro em danger com ícone
  used on   todos os formulários

LeadForm (depois do resultado)
  fields    nome, WhatsApp, e-mail (opcional), consentimento LGPD (obrigatório, link para privacidade),
            "aceito receber contato" (marketing)
  states    default, enviando, erro, sucesso (vai para /obrigado e abre o WhatsApp)
  rule      3 campos visíveis no máximo; Turnstile invisível
  used on   S14, S15, embutido

Stepper / Timeline
  variants  horizontal (desktop), vertical (mobile); "como funciona" com 4 passos (Simulação →
            Análise com os bancos → Documentos e avaliação → Liberação)
  tokens    número em círculo brand, linha border
  used on   S10, S11, S12, S13, S16

Card
  variants  benefício (ícone + título + texto), produto, depoimento, artigo, parceiro (logo em
            escala de cinza → cor no hover, só com autorização do banco), estatística (número grande)
  tokens    bg bg, borda border, radius lg, shadow card → raised no hover (quando é link)
  used on   site

TrustBar
  content   "Desde 2015", "Atendimento em 9 estados", "Bancos parceiros", nota do Google (quando houver)
  used on   abaixo do hero

Testimonial
  content   texto, nome como autorizado, cidade/UF, estrelas, fonte (Google)
  rule      só depoimentos com autorização registrada (tabela depoimentos)
  a11y      carrossel com pausa, setas com label, sem autoplay
  used on   S10 a S13

FAQ (accordion)
  states    fechado, aberto, focus-visible
  a11y      Radix Accordion (botões com aria-expanded); o conteúdo também vai em JSON-LD FAQPage
  used on   S10 a S13, S22

LegalNotice
  variants  inline (simulador), bloco (rodapé)
  text      simulação ilustrativa, sujeita a análise e aprovação; não inclui IPCA, seguros, tarifas e
            impostos; taxa a partir de, para o melhor perfil; Big Assessoria atua como consultora e
            representante de bancos parceiros
  tokens    text-sm text-muted, ícone info
  used on   simulador, rodapé, /obrigado

CookieBanner
  variants  barra inferior; painel "Personalizar" (necessários / estatística / marketing)
  rule      "Aceitar" e "Recusar" com o mesmo peso visual (LGPD); a escolha atualiza o Consent Mode
  a11y      role="dialog", não prende o foco, alcançável pelo teclado
  used on   site público

Toast
  variants  success, danger, info; 5 s, pausa no hover
  a11y      role="status" (info/success), role="alert" (danger)
  used on   painel, documentos

Badge
  variants  etapa do funil (cor por etapa), temperatura (frio azul-acinzentado / morno warning /
            quente danger + ícone de chama), canal (ícone do canal), status de documento
  rule      nunca só cor: sempre texto + ícone
  used on   painel

DocumentUpload (item do checklist)
  states    pendente, arrastando (borda accent tracejada), enviando (barra de progresso %),
            enviado, aprovado (success), rejeitado (danger + motivo + "Enviar de novo"), erro de rede
            (retomar), arquivo inválido (tipo/tamanho)
  behavior  câmera do celular direto (capture), vários arquivos por item, PDF/JPG/PNG/HEIC até 10 MB
  a11y      input file real com label; progresso com role="progressbar" e aria-valuenow
  used on   S17b

CodeInput (6 dígitos)
  behavior  6 caixas, colar o código inteiro preenche tudo, autocomplete="one-time-code"
  states    vazio, digitando, erro (tremor sutil + mensagem), bloqueado (5 tentativas: mensagem + "pedir
            novo código"), expirado
  used on   S17a

Panel shell
  parts     sidebar (Conversas, Funil, Leads, Dashboard, Agente IA, Conexões, Configurações),
            topbar (busca, filtro de vendedor para gestor, status das conexões, usuário)
  used on   S25, S27 a S34

ConversationList / ChatThread
  list item nome, última mensagem, hora, badge de etapa e temperatura, ponto de "aguardando resposta"
            com o tempo (vermelho > 15 min), ícone do canal
  thread    bolhas: cliente (surface), vendedor/aparelho (brand-soft), agente IA (borda tracejada +
            selo "IA"), sistema (centralizado, text-muted). Áudio com player + transcrição.
            Composer com anexo; banner "Agente IA ativo nesta conversa" com o botão de pausar
  states    vazio, carregando (skeleton), nova mensagem em tempo real, instância desconectada (aviso)
  used on   S27, S28

KanbanBoard
  columns   as 9 etapas; card com nome, valor, temperatura, dias parado, vendedor, resumo da IA (1 linha)
  behavior  arrastar com mouse, toque e teclado (dnd-kit); mover para Perdido abre o motivo
  states    coluna vazia, arrastando, salvando, erro (volta o card + toast)
  used on   S29

KPI / Chart
  rule      seguir o skill dataviz no build: números grandes (font-display), gráficos simples (funil,
            barras por canal, linha no tempo), sempre com tabela acessível
  used on   S30

Toggle (liga/desliga do agente)
  states    on, off, disabled (sem permissão), loading
  a11y      role="switch" com aria-checked e label explícito ("Agente IA no número do André")
  used on   S27, S31, S34

EmptyState
  content   ícone, uma frase do que falta, uma ação (ex.: "Nenhuma conversa ainda. Conecte um número.")
  used on   todas as listas do painel
```

## Primitivas

São construídas no início do /replica-build (fatia vertical), numa rota `/design` interna e protegida, antes de
qualquer tela. A captura dessa página é a checagem do design system. O preview estático (artifact
"Big Assessoria: design") mostra a direção (cores, tipografia, botões, simulador, cards) para aprovação do
cliente antes disso.
