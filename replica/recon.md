# Recon map: ZAFF LTDA (web) → site da Big Assessoria

Scope: site público de captação de leads para crédito imobiliário. O que estamos mapeando é o
**fluxo principal**: o visitante simula → deixa os dados → é atendido no WhatsApp → envia os
documentos. Ficam de fora as frentes da ZAFF que não são da Big (M&A de empresas,
investimentos, venda/aquisição reservada de imóveis, IoTrust, contabilidade).
For: Big Assessoria, assessoria e consultoria de financiamento imobiliário e crédito com
garantia de imóvel (home equity). O site é o canal de vendas dela, com foco em SEO e conversão.
Date: 2026-10-14

> Descoberta importante: o simulador da ZAFF já diz "em parceria com a **BIG Assessoria**".
> A ZAFF revende o produto da Big. O site novo é o canal **direto** da Big, então deve ser
> melhor que o do parceiro e não competir com ele de forma confusa. Confirmar com o cliente
> como fica a relação comercial com a ZAFF.

## Decisões do cliente (2026-10-14)

- **Taxa do simulador:** taxa baixa e atrativa, apresentada como simulação. A simulação real é feita
  depois, com os bancos parceiros, porque não se sabe qual vai aprovar.
  Regra: a taxa exibida deve ser a **menor taxa real praticada por algum parceiro** (melhor perfil),
  mostrada como "a partir de X% a.m." com aviso. Uma taxa que nenhum parceiro pratica conta como
  publicidade enganosa (CDC arts. 37 e 52), mesmo com o aviso. A taxa fica configurável no painel/env,
  não fixa no código. **Valor definido: a partir de 1,19% a.m.** (taxa mínima informada pelo cliente).
- **LTV máximo:** financiamento (compra) **80%** do valor do imóvel; home equity **60%**. Um valor só por
  produto, igual no simulador, no FAQ, nos anúncios e no agente de IA.
- **Posicionamento:** "consultora e representante de bancos parceiros" (definição do cliente). Usar
  "representante" pressupõe contrato com cada banco; se algum parceiro não tiver contrato formal, usar
  "consultoria que trabalha com bancos parceiros" nas páginas e anúncios.
- **Acessos:** Google Ads, Meta Business, GA4/GTM, Google Meu Negócio, UAZAPI, hospedagem e domínio ficam
  com um administrador único (Fernando).
- **Site atual (só referência, será substituído):** https://bigassessoria.adm.br. Dele aproveitamos os dados,
  não o layout:
  - cidades Ijuí/RS, Porto Alegre/RS e Joinville/SC;
  - e-mails andre@ e estela@bigassessoria.adm.br (prováveis vendedores);
  - telefone (55) 99168-8677;
  - parceiros pelos logos: Itaú, Inter, Banco Paulista, CashMe, Wimo e Galleria. Confirmar quais estão
    ativos e se podem aparecer no site;
  - outros serviços no site atual: carta fiança, seguros, antecipação de recebíveis, antecipação de
    aluguel e financiamento de máquinas. Ficam fora do novo site por foco (crédito imobiliário).
    Confirmar com o cliente.
  - Domínio atual `.adm.br`; o novo domínio será definido no deploy.
- **Marca:** o logo do cliente é mantido (navy `#37495D` medido + cinza `#9E9E9E`); proposta de versão flat
  vetorial. Ver `design/`.

## Simulador: especificação (referência: simulador de concorrente, `screens/concorrente-simulador.jpg`)

Referência só de funcionalidade. Layout, cores e textos são próprios da Big (/replica-design).
Conta conferida: Price, R$ 500.000, 1,19% a.m., 240 meses = **R$ 6.319,54** (o concorrente mostra R$ 6.320).

| campo | regra |
| --- | --- |
| Produto | Home equity (LTV 60%) ou Financiamento (LTV 80%); define o teto de crédito a partir do valor do imóvel |
| Valor do imóvel | obrigatório para checar o LTV |
| Valor do crédito | mín. R$ 100 mil, máx. R$ 10 milhões **e** ≤ LTV × valor do imóvel; avisa se passar |
| Sistema | Price ou SAC (toggle). SAC mostra a 1ª e a última parcela (R$ 500 mil / 240 m / 1,19% → 1ª R$ 8.033,33) |
| Taxa | chips 1,19 / 1,29 / 1,39 / 1,49 / 1,59 / 1,69 % a.m. + campo livre, **mínimo 1,19** (configurável no painel). Padrão: 1,19 |
| Prazo | chips 60 / 120 / 180 / 240 meses (configurável). Padrão: 240 para mostrar a menor parcela; financiamento pode ir além se o cliente definir |
| Carência | 30 / 60 / 90 dias. 30 = 1ª parcela no mês seguinte, sem juros extras. 60 e 90 = juros do período a mais **capitalizados no saldo** (PV × (1+i)^(meses extras)) antes de calcular a parcela. Confirmar essa regra com o cliente |
| Resultado | "Parcela em Nx (carência de X dias): R$ …/mês" + linha "Taxa: X% a.m. + IPCA • PRICE/SAC" |
| **Avisos obrigatórios no resultado** | (1) simulação ilustrativa, sujeita a análise e aprovação do banco parceiro; (2) **a parcela não inclui a correção pelo IPCA, seguros (MIP/DFI), tarifas e impostos**: a parcela real é maior e muda com a inflação; (3) taxa "a partir de", para o melhor perfil. Sem o aviso (2), a parcela "+ IPCA" exibida induz a erro |
| Depois do resultado | CTA "Quero essa simulação com os bancos" → pede nome + WhatsApp (+ e-mail opcional) → grava o lead com a simulação → página de obrigado / WhatsApp |

Melhorias sobre o concorrente: valor do imóvel + LTV por produto (o concorrente não pede o imóvel), aviso de
IPCA/seguros explícito, comparativo Price × SAC lado a lado, simulação salva no lead e devolvida ao vendedor
e ao agente de IA.
- **Região de atendimento:** MG, SP, MS, MT, PR, SC, RS, RJ e ES (9 UFs). O simulador aceita só
  essas UFs. Para as outras, mostra uma mensagem e captura o lead mesmo assim como "fora da região"
  (não descarta).
- **Empresa (consulta pública do CNPJ via BrasilAPI, 2026-10-14):**
  B.I.G. SOLUCOES IMOBILIARIAS LTDA, nome fantasia **BIG ASSESSORIA**, CNPJ **22.309.209/0001-74**, ATIVA,
  início em 22/04/2015 (usar como "desde 2015"), ME, LTDA. Sede: Rua dos Ipês, 9, Cond. Residencial Fricke,
  Tiaraju, Ijuí/RS, CEP 98703-028. Telefone no cadastro: (55) 9168-8677.
  CNAE principal 8211-3/00 (apoio administrativo); secundários 6821-8/01 (corretagem e avaliação de
  imóveis), 6821-8/02, 7319-0/02 (promoção de vendas), 8291-1/00.
  **Atenção:** não consta o CNAE 6619-3/02 (correspondente de instituições financeiras). Os textos do site
  vão posicionar a Big como **assessoria/intermediação** que trabalha com instituições parceiras, sem se
  apresentar como correspondente bancário nem como instituição financeira. Confirmar com o contador se
  esse é o enquadramento correto antes de publicar.
  O endereço é residencial (condomínio): no Google Meu Negócio, usar **empresa de área de serviço**
  (endereço oculto, área = 9 UFs). No site, mostrar cidade/UF e CNPJ; o endereço completo vai só no
  rodapé legal, se o cliente aprovar.
- **Documentos:** coleta dos principais documentos com **acesso por código enviado no WhatsApp**
  (ver F07). O consultor libera o código depois do primeiro contato; o cliente entra com
  WhatsApp + código, completa os dados e envia os documentos.
- **WhatsApp via UAZAPI:** toda a comunicação com o cliente entra e sai pela UAZAPI (não é a API oficial).
  Modelo: **um número comercial por vendedor**, cada um conectado como instância na UAZAPI. O vendedor
  responde pelo próprio celular (app ou WhatsApp Business). As mensagens enviadas pelo aparelho chegam no
  webhook como `fromMe` e são gravadas. **Só são gravadas as conversas de contatos que são leads** (vieram
  do site, de um link rastreável ou foram marcados pelo vendedor); grupos e contatos pessoais são
  descartados sem gravar (LGPD). Riscos aceitos: banimento do número em disparos frios (usar só para
  atendimento, ter número reserva); desconexão se o celular ficar ~14 dias offline (o painel alerta).
- **Painel comercial (CRM próprio):** inbox, funil kanban, temperatura por IA, dashboard por canal e por
  vendedor, alertas. Ele roda no mesmo banco do site.
- **Canal = origem do lead:** UTM/gclid/fbclid no site + links rastreáveis `/w/[canal]` (Instagram,
  Facebook, Google Meu Negócio, parceiros) que registram o clique e abrem o WhatsApp com mensagem marcada.
  Direct do Instagram e Messenger ficam fora (exigiriam a API oficial da Meta).
- **Rastreamento e tráfego pago são prioridade:** a conversão de cada etapa do funil volta para o Google Ads
  e a Meta (conversões offline / CAPI), para os anúncios otimizarem por lead qualificado e proposta, não
  por formulário preenchido. Ver `trafego-pago.md`.
- **Agente de IA no WhatsApp (atendimento inicial):** responde o primeiro contato e as dúvidas, coleta os
  dados de qualificação (tipo e valor do imóvel, cidade/UF, quitado ou financiado, valor desejado, prazo,
  finalidade, renda, urgência), roda a simulação e passa para o vendedor quando o lead está qualificado
  ou pede humano. Regras:
  - **Liga/desliga** global, por vendedor (instância) e por conversa, no painel.
  - **Pausa sozinho** quando o vendedor responde pelo celular (`fromMe` do aparelho) e não volta naquela
    conversa até ser reativado.
  - Apresenta-se como assistente virtual da Big; nunca promete aprovação nem taxa final; não pede
    documentos nem dados sensíveis no chat (para isso existe o código de documentos).
  - Transfere para humano quando: o lead pede, há reclamação, a pergunta está fora da base de
    conhecimento, ou o lead atinge "Qualificado". O vendedor recebe alerta com o resumo.
  - Base de conhecimento editável no painel (produtos, taxa "a partir de", regiões, documentos, FAQ).
  - Horário de funcionamento configurável; fora do horário, a IA atende e avisa quando o humano retorna.
  - **Proteção do número (UAZAPI):** só responde a quem mandou mensagem (nunca inicia conversa); atraso
    humano de alguns segundos com "digitando..."; mensagens curtas; limite de mensagens por conversa
    antes de chamar humano. Isso reduz, mas não elimina, o risco de banimento.
  - Modelo: Claude (Sonnet para conversar, Haiku para classificar), via API.
- **Fase única:** tudo entra numa entrega só (site + simulador + documentos + painel + IA + agente +
  rastreamento), por urgência. Size: **L** (ver Size).
- **Revisar após a entrega:** páginas por cidade, guia em PDF, sequência de nutrição, teste A/B e
  integração com banco ficam no plano como `could` e serão avaliadas com dados reais.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site (home) | https://zaffltda.com.br/ | hero, 5 frentes, método, princípios, FAQ, formulário → WhatsApp |
| 2 | simulador | https://zaffltda.com.br/simulacao | simulador de home equity, Price a 1,09% a.m., LTV até 80%, 36 a 180 meses |
| 3 | parcerias | https://zaffltda.com.br/parcerias | cards de parceiros; a BIG aparece com CTA de WhatsApp pré-preenchido |
| 4 | documentos | https://zaffltda.com.br/documentos | checklist carregado por JavaScript ("Abrindo seu checklist..."), sem conteúdo legível. Pedir ao usuário: screenshot ou acesso pelo link individual |
| 5 | contexto de mercado | https://www.creditas.com/exponencial/home-equity-para-empresas/ , https://sienge.com.br/blog/home-equity/ | referência de categoria (Creditas é o benchmark de UX em home equity no Brasil) |

Sem help center, changelog, app store ou API pública: é um site institucional.

## Core loop

O visitante descobre quanto crédito consegue com o próprio imóvel (ou para comprar um imóvel),
vê uma parcela estimada e manda os dados para um consultor, que conduz pelo WhatsApp até a
liberação.

## Screens (original)

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | `/` | posicionamento + escolha de frente + contato | header/nav, hero com 2 CTAs, seletor "Como podemos atuar" (5 opções), 4 eixos, 5 cards de atuação, método em 3 passos, 4 princípios, FAQ (5, texto fixo), formulário "contato reservado", footer com aviso legal | filled |
| S02 | Simulação | `/simulacao` | simular home equity e pedir análise | form em 3 blocos (imóvel / operação / contato), select de UF→cidade em cascata, resultado ao vivo (parcela, LTV, taxa), timeline de 4 etapas, FAQ, aviso legal | default (1M / 500k / 180m), filled, campos destacados para revisar (erro) |
| S03 | Parcerias | `/parcerias` | vitrine de parceiros (IoTrust, BIG, VB) | cards de parceiro, detalhe por parceiro com passos e FAQ, CTAs de WhatsApp pré-preenchidos, formulário só da VB | filled |
| S04 | Enviar documentos | `/documentos` (link individual) | checklist de documentos por cliente | carregamento dinâmico, conteúdo não visível sem link | loading ("Abrindo seu checklist...") |
| S05 | WhatsApp | externo (wa.me) | fechamento da conversa | mensagem pré-preenchida com o resumo do formulário | — |

## Screens (clone: Big Assessoria, proposto)

| ID | screen | route | purpose | notes |
| --- | --- | --- | --- | --- |
| S10 | Home | `/` | proposta + simulador curto acima da dobra + prova social | substitui S01 |
| S11 | Home Equity | `/credito-com-garantia-de-imovel` | landing SEO + simulador | palavra-chave principal |
| S12 | Financiamento imobiliário | `/financiamento-imobiliario` | compra de imóvel (SFH/SFI), comparativo de bancos | não existe na ZAFF |
| S13 | Portabilidade / refinanciamento | `/portabilidade-de-financiamento` | baixar parcela de quem já financia | não existe na ZAFF |
| S14 | Simulador | `/simulador` | simulador completo em etapas (Price e SAC, CET estimado) | evolução de S02 |
| S15 | Resultado + agendamento | `/simulador/resultado` | parcela, comparativo, CTA WhatsApp + agendar ligação | S02 mostra o resultado inline |
| S16 | Obrigado | `/obrigado` | confirmação + próximos passos + checklist de docs | dispara a conversão (GA4/Meta/Google Ads) |
| S17a | Acesso aos documentos | `/documentos` | WhatsApp + código de 6 dígitos recebido no WhatsApp | estados: vazio, código inválido, expirado, bloqueado por tentativas |
| S17b | Dados + envio de documentos | `/documentos/enviar` (sessão após o código) | completar cadastro (CPF, estado civil, profissão, endereço, dados do imóvel) + upload por item do checklist | estados: vazio, enviando %, enviado, rejeitado pelo consultor, concluído |
| S18 | Sobre / equipe | `/sobre` | E-E-A-T: pessoas, CNPJ, bancos parceiros | não existe na ZAFF |
| S19 | Blog (lista) | `/blog` | SEO de cauda longa | não existe na ZAFF |
| S20 | Artigo | `/blog/[slug]` | conteúdo + simulador embutido + CTA | |
| S21 | Cidades/regiões | `/home-equity/[cidade]` | SEO local (capitais e polos das 9 UFs atendidas: MG, SP, MS, MT, PR, SC, RS, RJ, ES) | se houver conteúdo real por cidade, sem páginas-doorway |
| S22 | FAQ | `/perguntas-frequentes` | FAQ completo com schema FAQPage | |
| S23 | Contato | `/contato` | formulário + WhatsApp + mapa/endereço | |
| S24 | Política de privacidade / termos | `/privacidade`, `/termos` | LGPD | obrigatório |
| S25 | Painel: login | `/painel/login` | acesso de vendedor/gestor | e-mail + senha ou magic link; papéis: vendedor (vê os seus), gestor (vê tudo) |
| S27 | Painel: inbox | `/painel/conversas` | conversas com etapa, temperatura e resumo da IA; responder pela UAZAPI | filtros: vendedor, etapa, temperatura, canal, sem resposta |
| S28 | Painel: contato | `/painel/leads/[id]` | ficha única: conversa, simulações, documentos, dados, histórico de etapas, liberar/revogar código | timeline de eventos |
| S29 | Painel: funil kanban | `/painel/funil` | cards por etapa, arrastar, dias parado, valor | etapas fixas (ver Funil) |
| S30 | Painel: dashboard | `/painel/dashboard` | leads e conversão por canal/campanha/vendedor, tempo por etapa, motivos de perda, valor em negociação, CPL/CAC | período, comparação |
| S31 | Painel: conexões WhatsApp | `/painel/conexoes` | instâncias UAZAPI por vendedor, status, QR code para reconectar | alerta de desconexão |
| S32 | Painel: configurações | `/painel/config` | taxa "a partir de", LTV, prazos, UFs, checklist de documentos, links rastreáveis, vendedores, gasto em anúncios | só gestor |
| S34 | Painel: agente de IA | `/painel/agente` | liga/desliga, horário, base de conhecimento, log de conversas da IA e transferências | só gestor |
| S33 | Link rastreável | `/w/[canal]` | registra o clique (canal, UTM, gclid/fbclid) e redireciona ao WhatsApp com mensagem marcada | sem tela: redirect |
| S26 | 404 | — | recuperar o visitante perdido com CTA para o simulador | |

## Flows

```
F01 Visitante simula home equity e fala com consultor  (ZAFF)
    S01 -> [Simular crédito] -> S02 preenche 3 blocos (~16 campos) -> [Solicitar análise] -> S05 WhatsApp
    happy path clicks: ~20 (16 campos + UF + cidade + 2 botões), tudo numa tela longa
    edge: imóvel financiado com saldo devedor; LTV acima do limite; imóvel fora de SP/SC/PR/RS (form aceita,
          rodapé diz que não atende); valor acima do teto por tipo de imóvel; WhatsApp sem DDD
    meta clone: simulador em etapas, resultado com 4 campos antes do contato, contato só depois de ver a parcela

F02 Visitante usa o formulário "contato reservado"  (ZAFF)
    S01 -> #analise -> assunto + nome + cidade/UF + faixa de valor + contexto -> [Iniciar conversa] -> S05
    happy path clicks: ~7
    edge: sem WhatsApp no dispositivo (desktop sem app) → abre web.whatsapp; lead se perde se fechar a aba

F03 Cliente envia documentos  (ZAFF)
    link individual -> S04 checklist -> (upload? não verificado)
    edge: link expirado, arquivo grande demais, foto ilegível
    meta clone: S17 com upload direto (PDF/JPG/HEIC), progresso por item, aviso LGPD

F04 Visitante vindo do Google lê um artigo e converte  (só no clone)
    busca -> S20 artigo -> simulador embutido -> S15 -> S16
    edge: mobile com 3G; visitante volta depois (retomar simulação salva)

F05 Visitante quer comprar imóvel (financiamento)  (só no clone)
    S12 -> simulador modo "compra" (valor do imóvel, entrada, renda, idade) -> S15 comparativo -> S16

F07 Cliente envia documentos com código do WhatsApp  (só no clone, substitui F03)
    lead qualificado -> consultor clica "liberar documentos" no painel (ou automático após o lead)
    -> sistema gera código de 6 dígitos e envia pela UAZAPI (número do vendedor do lead) com o link /documentos
    -> S17a cliente digita o WhatsApp + código -> sessão curta (cookie httpOnly, 2h)
    -> S17b completa os dados -> sobe os documentos item a item -> [Concluir] -> consultor é avisado
    happy path clicks: ~3 para entrar + 1 por documento
    segurança: o código é guardado com hash, vale 24h e só pode ser usado por aquele número;
               são 5 tentativas antes de bloquear; há limite de pedidos por IP; o consultor pode reenviar
               ou revogar o código; os arquivos ficam num bucket privado e só são vistos por URL assinada
               de curta duração; tudo é registrado em log de auditoria
    edge: código expirado (botão "pedir novo código" reenvia pelo WhatsApp), número diferente do
          cadastrado, upload interrompido no 4G (retomar), foto ilegível (consultor rejeita o item com
          motivo e o cliente recebe aviso no WhatsApp), arquivo > 10 MB, HEIC do iPhone, cliente volta
          outro dia (novo código, os arquivos já enviados continuam lá)
    por que é melhor que o link fixo: o link vazado sozinho não dá acesso; o código prova que a
    pessoa tem aquele WhatsApp

F08 Mensagem chega no WhatsApp e entra no funil  (painel)
    cliente manda mensagem (ou vendedor responde pelo celular) -> UAZAPI webhook -> é lead? (telefone já conhecido,
    mensagem com marcador de link /w/, ou vendedor marcou) -> sim: grava a mensagem, cria/atualiza o lead e
    atribui o canal; não: descarta sem gravar
    -> áudio: transcreve -> IA (Claude Haiku) lê a conversa e devolve etapa sugerida, temperatura 0-100,
       resumo de 1 linha e próximo passo -> painel atualiza em tempo real
    -> mudança de etapa dispara conversão offline para Google Ads / Meta CAPI
    edge: mensagem duplicada no webhook (idempotência por message_id), instância desconectada, mensagem
          apagada/editada, vendedor corrige a etapa (a correção humana vence e não é sobrescrita pela IA)

F09 Gestor acompanha o resultado  (painel)
    S30 dashboard -> filtra canal/campanha -> vê CPL, custo por lead qualificado, por proposta e por contrato
    -> ajusta o investimento (ver trafego-pago.md)

F10 Alerta para o vendedor
    lead quente sem resposta > 15 min, ou parado em Documentação > 3 dias, ou instância caiu
    -> mensagem no WhatsApp do vendedor/gestor (pela UAZAPI) + destaque no painel

F11 Agente de IA faz o atendimento inicial
    lead manda mensagem -> agente ativo (global + instância + conversa)? -> dentro do horário? ->
    responde com atraso humano -> pergunta os dados que faltam, um ou dois por mensagem -> roda a
    simulação com a taxa configurada -> lead atinge "Qualificado" ou pede humano -> agente para e
    transfere -> alerta ao vendedor com resumo + simulação -> vendedor assume pelo celular
    edge: vendedor responde no meio (a IA pausa na hora); lead manda áudio (transcreve e responde);
          lead manda documento no chat (agradece e envia o código de documentos se liberado, senão
          chama o vendedor); pergunta fora da base (transfere, não inventa); lead fora da região (avisa
          com educação e marca fora_regiao); agente desligado (a mensagem só entra no inbox)

F06 Visitante escolhe parceiro e cai no WhatsApp da BIG  (ZAFF, S03)
    S03 -> card BIG -> [WhatsApp] mensagem pré-preenchida (nome, cidade, valor imóvel, crédito)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Header/nav | desktop, mobile (drawer) | default, sticky/scrolled, aberto | todas |
| Button | primary, secondary, ghost, whatsapp | default, hover, focus, disabled, loading | todas |
| Hero | com imagem, com simulador curto | — | S01, S10, S11, S12 |
| Seletor de intenção ("Como podemos atuar") | 5 opções clicáveis (clone: 3 a 4 produtos) | default, selecionado | S01 |
| Card de serviço numerado | 01 a 05 | default, hover | S01 |
| Steps/timeline | 3 passos (método), 4 passos (processo) | — | S01, S02 |
| Valores/princípios | grid de 4 | — | S01 |
| FAQ | texto fixo (ZAFF); clone: accordion | fechado, aberto | S01, S02, S03 |
| Input moeda (BRL) | — | vazio, preenchido, erro, focado | S02 |
| Select | simples, cascata UF→cidade | desabilitado até escolher a UF, carregando | S02 |
| Prazo | slider ou select (não confirmado) | 36 a 180 | S02 |
| Painel de resultado ao vivo | parcela, LTV, taxa | atualizando, fora do limite | S02 |
| Input telefone/WhatsApp | máscara (clone) | erro | S02, S01 |
| Aviso legal / disclaimer | inline, footer | — | todas |
| Card de parceiro | IoTrust, BIG, VB | — | S03 |
| Botão WhatsApp com mensagem pré-preenchida | inline (ZAFF); clone: também flutuante | — | S01, S02, S03 |
| Footer | institucional + contato + aviso | — | todas |
| (clone) Upload de documento | por item do checklist | vazio, enviando %, enviado, erro, rejeitado | S17 |
| (clone) Depoimento/avaliação Google | carrossel, grid | — | S10 a S13 |
| (clone) Banner de cookies (LGPD) | — | aceito, recusado, personalizado | todas |

## Inferred data model

```
Lead        id, created_at, nome, whatsapp, email, cidade, uf, melhor_horario,
            produto (home_equity | financiamento | portabilidade | outro),
            origem (utm_source/medium/campaign, gclid, fbclid, landing_page),
            status (novo | em_atendimento | documentacao | analise | aprovado | liberado | perdido),
            consentimento_lgpd (bool + timestamp)
            evidence: S02 bloco contato, S01 formulário, mensagem pré-preenchida S03
            confidence: high (campos); status e UTM: guess (não visível, mas é o que se precisa)

Simulacao   id, lead_id?, tipo_imovel (casa | apartamento | terreno_outro), valor_imovel,
            situacao (quitado | financiado), saldo_devedor, valor_desejado, prazo_meses (36..180),
            finalidade (capital_giro | reforma | expandir_empresa | comprar_imovel_empresa |
                        quitar_dividas | projeto_proprio | outra),
            renda_mensal, urgencia (30d | 1-3m | 3-6m | planejando),
            taxa_mensal (1,09%), sistema (price), parcela_estimada, ltv
            evidence: S02 todos os campos; parcela = Price(500k, 1,09% a.m., 180) = R$ 6.353 confere
            confidence: high

Imovel      (na ZAFF fica embutido na Simulacao) tipo, uf, cidade, valor, situacao, saldo_devedor
            evidence: S02; confidence: high

Regra/Limite  tipo_imovel → teto (casa/apto 10M, terreno/outro 100M), ltv_max (80% no simulador,
              "~60%" no FAQ: inconsistente), prazo_min 36, prazo_max 180, taxa_a_partir 1,09% a.m.
              evidence: S02; confidence: high (valores), guess (se a taxa varia por perfil)

ChecklistDocumento  id, lead_id, status (pendente | em_envio | concluido), itens[{tipo, obrigatorio,
              status (pendente | enviado | aprovado | rejeitado), motivo_rejeicao, arquivo_path, enviado_em}]
              tipos principais (decisão do cliente: "os principais"):
                pessoais: RG/CNH, CPF, comprovante de estado civil (certidão), comprovante de residência
                renda: holerites/extratos (PF) ou pró-labore/IR/faturamento (PJ), última declaração de IR
                imóvel: matrícula atualizada, IPTU (capa), fotos do imóvel (opcional)
                financiado: extrato do saldo devedor
              evidence: S02 etapa "Análise", decisão do cliente; confidence: medium (lista final com o cliente)

CodigoAcesso  id, lead_id, whatsapp, codigo_hash, expira_em, tentativas, usado_em, revogado,
              criado_por (sistema | consultor), ip_ultimo_uso
              evidence: decisão do cliente (F07); confidence: high

DadosCadastrais  lead_id, cpf, data_nascimento, estado_civil, profissao, endereco{...},
              conjuge{nome, cpf}?, imovel{endereco, matricula, cartorio}
              evidence: coleta em S17b; confidence: medium

AuditLog      id, lead_id, ator (cliente | consultor | sistema), acao, ip, criado_em
              evidence: LGPD + dados sensíveis; confidence: high (necessário)

Post (clone)  slug, titulo, resumo, corpo, autor, categoria, publicado_em, atualizado_em, seo{title,desc,og}
```

Vendedor     id, nome, email, papel (vendedor | gestor), whatsapp_alerta, ativo
Instancia    id, vendedor_id, uazapi_instance_id, token (secreto), numero, status (conectada | desconectada),
             ultimo_evento_em
Conversa     id, lead_id, instancia_id, ultima_mensagem_em, aguardando_resposta (bool), primeira_resposta_seg
Mensagem     id, conversa_id, uazapi_message_id (único, idempotência), direcao (entrada | saida),
             origem_envio (aparelho | api), tipo (texto | audio | imagem | documento | chamada),
             texto, transcricao, midia_path, enviado_em, apagada, editada
Classificacao  id, lead_id, etapa_sugerida, temperatura (0-100), resumo, proximo_passo, modelo, criado_em,
             sobrescrita_por_humano (bool)
EtapaHistorico  id, lead_id, de, para, por (ia | vendedor | sistema), motivo_perda?, criado_em
Canal / LinkRastreavel  id, slug (/w/instagram), canal (instagram | facebook | google_ads | google_meu_negocio |
             site_organico | parceiro | indicacao | outro), parceiro?, mensagem_marcador, utm_*
Clique       id, link_id, gclid, fbclid, fbp, fbc, user_agent, ip_hash, criado_em
ConversaoEnviada  id, lead_id, plataforma (google_ads | meta), evento, valor, enviado_em, status, erro
GastoAnuncio id, plataforma, campanha, data, valor  (importado por API ou digitado)

AgenteConfig  ativo_global, horario{dias, inicio, fim}, mensagem_fora_horario, max_mensagens_antes_humano,
             base_conhecimento (texto/markdown editável), modelo
AgenteEstado  conversa_id, ativo (bool), pausado_por (vendedor | gestor | transferencia), pausado_em
AgenteLog     id, conversa_id, mensagem_id, resposta, ferramentas_usadas (simulacao...), motivo_transferencia?,
             tokens, custo, criado_em

Lead ganha: vendedor_id, etapa, temperatura, canal_id, motivo_perda, valor_operacao, fora_regiao (bool).
Instancia ganha: agente_ativo (bool).

Relationships: Lead 1-n Simulacao, Lead 1-1 ChecklistDocumento, ChecklistDocumento 1-n Item/Arquivo,
Lead 1-n CodigoAcesso, Lead 1-1 DadosCadastrais, Lead 1-n AuditLog, Vendedor 1-n Instancia,
Vendedor 1-n Lead, Lead 1-n Conversa, Conversa 1-n Mensagem, Lead 1-n Classificacao,
Lead 1-n EtapaHistorico, Canal 1-n Lead, LinkRastreavel 1-n Clique, Lead 1-n ConversaoEnviada.

## Funil

| etapa | entra quando | conversão enviada aos anúncios |
| --- | --- | --- |
| Novo lead | primeira mensagem ou simulação | `Lead` |
| Em atendimento | o vendedor responde | — |
| Qualificado | imóvel na região, valor e interesse confirmados (IA sugere, vendedor confirma) | `QualifiedLead` (principal para otimizar) |
| Documentação | o código de documentos foi liberado | `SubmitApplication` |
| Análise no banco | documentos completos | — |
| Proposta | o banco aprovou e o cliente recebeu as condições | `Proposal` |
| Contrato / registro | o cliente aceitou | — |
| Liberado ✅ | o crédito caiu na conta | `Purchase` com valor = receita da Big |
| Perdido ❌ | motivo obrigatório (taxa, desistência, reprovação, sem retorno, fora da região, outro) | — |

Temperatura é separada da etapa: frio (<40), morno (40-69), quente (≥70).

## Achados para vender mais (gaps da ZAFF que o clone resolve)

1. **O contato só vai pelo WhatsApp, sem gravar o lead.** Se o visitante fecha a aba, o lead some, e não há
   UTM nem atribuição. O clone grava antes, depois abre o WhatsApp e avisa o consultor.
2. **Formulário longo numa tela só (~16 campos).** O clone usa etapas, mostra a parcela antes de pedir o contato
   e pede o mínimo para o primeiro contato.
3. **Inconsistências que derrubam confiança:** LTV 80% x 60%; atende SP/SC/PR/RS x aceita todas as UFs. O clone
   usa um único LTV em todo o site e aceita só as 9 UFs atendidas (as outras viram lead "fora da região").
4. **Só Price, sem CET.** O clone mostra Price e SAC e o CET estimado (com ITBI/registro/seguros como faixa).
   Isso também é exigência de transparência.
5. **Sem prova social:** nenhum depoimento, avaliação do Google, número de operações ou bancos parceiros. É o maior
   buraco de conversão em crédito.
6. **Zero conteúdo para SEO:** 4 páginas e nenhum blog. O clone ataca "home equity", "empréstimo com garantia de imóvel",
   "refinanciamento de imóvel", "financiamento imobiliário [cidade]" e "portabilidade de financiamento".
7. **FAQ como texto fixo, sem schema.** O clone usa accordion + FAQPage/FinancialService/LocalBusiness em JSON-LD.
8. **Só home equity.** O clone cobre financiamento para compra e portabilidade, que têm muito mais busca.

## Feature matrix

See `features.csv`. could: 5, must: 82, skip: 6.

## Out of scope (cannot or should not be cloned)

- Textos, fotos (`zaff-office.webp`, `zaff-house.webp`), marca e layout exato da ZAFF: a Big terá identidade
  própria (/replica-brand).
- Frentes que não são da Big: M&A, curadoria de investimentos, venda/aquisição reservada de imóveis,
  IoTrust, contabilidade VB.
- **Aprovação de crédito e taxa real:** dependem dos bancos/fintechs parceiros da Big. O site só estima.
  Taxa e regras do simulador vêm do cliente, não da ZAFF.
- **Integração direta com bancos (proposta automática):** só se a Big tiver API de parceiro (ex.: portais de
  correspondente). Fora do MVP.
- Direct do Instagram e Messenger no painel: exigem a API oficial da Meta; a UAZAPI cobre só o WhatsApp.
- Conteúdo de ligações de voz/vídeo do WhatsApp: só fica o registro da chamada.
- Histórico de conversas anterior à conexão do número na UAZAPI.
- **Regulatório:** se a Big for correspondente bancário, os avisos seguem a Res. CMN 4.935/2021 (identificar
  a instituição contratante). Confirmar o enquadramento e o CNPJ com o cliente. O site não pode prometer aprovação.
- Checklist `/documentos` da ZAFF: não lido (exige link individual). O clone desenha o próprio.

## Size

Screens 26 (site S10 a S26 + painel S25, S27 a S34), flows 11, entities 22. Hard parts: (1) integração UAZAPI:
webhook idempotente, várias instâncias, mensagens do aparelho (`fromMe`), filtro só-leads, mídia/áudio,
reconexão; (2) classificação por IA confiável + conversões offline para Google Ads/Meta CAPI com deduplicação;
(3) simulador correto (Price + SAC + CET + limites por tipo/UF) com taxa configurável; (4) acesso por código no
WhatsApp + upload seguro, bucket privado, auditoria e LGPD; (5) tag + consentimento (GTM, Consent Mode v2,
GA4, Pixel). O conteúdo de SEO (blog) é trabalho contínuo de redação, não de código.
Size: **L**, em **fase única** por decisão do cliente: ~5 a 7 semanas para tudo (o agente de IA soma ~1 semana). Para ir ao ar mais rápido sem
dividir o escopo, a ordem de construção põe primeiro o que gera e mede lead (site + simulador + rastreamento +
UAZAPI + funil). Os anúncios podem começar assim que isso estiver no ar, com o painel e a IA fechando em seguida
dentro da mesma entrega.
