# Architecture: site + painel comercial da Big Assessoria

Construído a partir de `recon.md` e `features.csv` (82 must, 5 could, 6 skip). Fase única.
Princípios: um repositório, um banco, um deploy. Nada de microsserviços. Serviços gerenciados.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web (site + painel) | **Next.js (App Router, versão estável atual) + TypeScript**, um app só | SSG/ISR para o site (SEO e Core Web Vitals), server actions e route handlers para o painel e os webhooks |
| styling | **Tailwind CSS + shadcn/ui**, tokens do /replica-design | componentes acessíveis prontos para o painel; o site usa os mesmos tokens |
| conteúdo (blog e páginas) | **MDX no repositório** (`content/`), com frontmatter de SEO | sem CMS para manter; Fernando publica (a Claude ajuda a escrever); build estático = página mais rápida possível |
| database | **Supabase Postgres** (`schema.sql`) | já é a stack do Fernando (MCP conectado); RLS, Realtime, Storage, Auth e Vault no mesmo lugar |
| auth (painel) | **Supabase Auth** (e-mail + senha, magic link) | papéis `vendedor` / `gestor` em `usuarios`; RLS usa `auth.uid()` |
| auth (cliente / documentos) | **sessão própria** após o código do WhatsApp: cookie `httpOnly`, assinado (JWT HS256), 2 h, escopo = 1 lead | o cliente não cria conta; o código prova a posse do WhatsApp |
| arquivos | **Supabase Storage**, buckets privados `documentos` e `midias-whatsapp` | URL assinada curta, nada público |
| realtime (inbox / kanban) | **Supabase Realtime** (postgres changes nas tabelas com RLS) | a conversa aparece no painel sem recarregar |
| WhatsApp | **UAZAPI** (decisão do cliente), um adaptador `lib/uazapi.ts` | toda a entrada e saída passa por um módulo só; endpoints exatos pela documentação oficial da UAZAPI na hora do build |
| IA | **Claude API**: `claude-sonnet-5-5` (agente que conversa), `claude-haiku-5-5` (classificação, resumo) | tool use para simular, consultar a base e transferir; modelos configuráveis em `configuracoes.agente` |
| transcrição de áudio | **OpenAI `gpt-4o-mini-transcribe`** (ou Groq Whisper), atrás de `lib/transcricao.ts` | a Claude API não transcreve áudio; troca de provedor sem mexer no resto |
| jobs e filas | **Inngest** | atraso "humano" (step.sleep), retentativas, debounce por conversa, crons; roda no próprio deploy |
| e-mail | **Resend** | magic link do painel, cópia dos alertas; domínio com SPF/DKIM/DMARC |
| agendamento | **Cal.com** (embed + webhook) | agenda de ligação sem construir calendário |
| tags e consentimento | **GTM + Consent Mode v2**, banner próprio (sem CMP pago) | GA4, Google Ads e Meta Pixel controlados pelo consentimento |
| conversões server-side | **Meta Conversions API** + **Google Ads API** (upload de conversões por clique, conversões avançadas para leads) | otimizar os anúncios pelas etapas do funil (ver `trafego-pago.md`) |
| cidades | **API de localidades do IBGE**, baixada no build para um JSON estático das 9 UFs | sem dependência em tempo real |
| anti-bot / rate limit | **Cloudflare Turnstile** + **Upstash Redis** | lead falso estraga a otimização dos anúncios |
| observabilidade | **Sentry** (erros) + **Vercel Analytics / Speed Insights** | saber quando o webhook ou o agente falham |
| hosting | **VPS do cliente via Portainer** (imagem Docker, build standalone; ver `Dockerfile` e `docker-compose.yml`) | decisão do cliente; mesmo fluxo dos outros projetos. ISR e crons de plataforma não existem aí: jobs passam pelo Inngest |

Hospedagem alternativa: Hostinger Node.js. Funciona, mas perde o ISR fácil, e o histórico de deploy de
Next/Nitro lá tem armadilhas (tipo de app e entry file, dependências fora do trace). Vercel é o padrão
recomendado; se for Hostinger, o /replica-deploy cobre.

### Pastas

```
app/
  (site)/                     páginas públicas (SSG/ISR)
  (site)/simulador/           simulador (client component, cálculo local)
  documentos/                 portal do cliente (código + upload)
  painel/                     painel (Supabase Auth, RLS)
  w/[canal]/route.ts          link rastreável
  api/                        webhooks e endpoints
lib/
  financeiro/                 price.ts, sac.ts, carencia.ts (funções puras + testes)
  uazapi.ts                   adaptador WhatsApp
  agente/                     prompt, ferramentas, guardrails
  conversoes/                 meta-capi.ts, google-ads.ts
  atribuicao.ts               cookie de visitante, primeiro e último toque
inngest/                      funções de background
content/                      MDX: páginas e blog
supabase/migrations/0001_init.sql   = replica/schema.sql
```

## Schema

Tables: **21** (`schema.sql`). Access rules: **RLS** no Supabase para o painel (vendedor vê os leads dele,
gestor vê tudo, pelo helper `pode_ver_lead()`). O site público, o portal de documentos, os webhooks e o
Inngest usam a **service role no servidor**, nunca no navegador, sempre com validação (zod) na entrada.

| grupo | tabelas |
| --- | --- |
| equipe | `usuarios`, `instancias` |
| atribuição | `canais`, `cliques` |
| funil | `leads`, `simulacoes`, `etapa_historico`, `classificacoes` |
| WhatsApp | `conversas`, `mensagens`, `agente_log` |
| documentos | `codigos_acesso`, `documento_tipos`, `documento_itens`, `dados_cadastrais`, `audit_log` |
| anúncios | `conversoes_enviadas`, `gastos_anuncio` |
| conteúdo/config | `configuracoes`, `depoimentos`, `agendamentos` |

Restrições que resolvem problemas no banco, não na tela:
- `leads.whatsapp_e164` único → o mesmo cliente que simulou no site e depois chamou no WhatsApp é **um lead só**.
- `mensagens (instancia_id, uazapi_message_id)` único → webhook duplicado não duplica mensagem.
- `codigo_ativo_por_lead` (índice único parcial) → nunca dois códigos válidos ao mesmo tempo.
- `conversoes_enviadas (lead_id, plataforma, evento)` único → cada etapa vai uma vez para cada plataforma,
  mesmo que o vendedor arraste o card para frente e para trás.
- `perda_tem_motivo` → não dá para marcar "Perdido" sem motivo.
- Gatilho `on_lead_etapa` → toda mudança de etapa grava histórico e enfileira a conversão, venha do kanban,
  da IA ou do sistema.
- Hash do código de acesso: o `grant` por coluna impede que o navegador leia `codigo_hash`.

O SQL ainda não foi executado. Ele roda na primeira migração do /replica-build, num branch do Supabase.

## Cálculo do simulador (`lib/financeiro`, funções puras, testadas)

```
i = taxa mensal (0.0119), n = prazo, PV = crédito
carência: k = carencia_dias/30 − 1 meses extras; PV' = PV × (1+i)^k   (30 dias → k = 0)
Price: PMT = PV' × i / (1 − (1+i)^−n)
SAC:   A = PV'/n; parcela_t = A + (PV' − A×(t−1)) × i; mostra a 1ª e a última
LTV:   crédito ≤ ltv[produto] × valor do imóvel; crédito entre R$ 100 mil e R$ 10 milhões
```

Caso de teste fixo (conferido na referência do concorrente): Price, R$ 500.000, 1,19%, 240 m, carência de
30 dias → **R$ 6.319,54**. SAC no mesmo caso: 1ª parcela **R$ 8.033,33**.
O cálculo roda no navegador (resposta instantânea) e é **refeito no servidor** ao gravar a simulação, com a
configuração do banco. O servidor é a fonte da verdade. A regra de carência deve ser confirmada pelo cliente.

## API

### Site público

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET `/`, `/credito-com-garantia-de-imovel`, `/financiamento-imobiliario`, `/portabilidade-de-financiamento`, `/sobre`, `/parceiros`, `/contato`, `/perguntas-frequentes`, `/blog`, `/blog/[slug]`, `/privacidade`, `/termos` | páginas SSG/ISR com metadados, JSON-LD e simulador embutido | público | — | HTML | F04, F05 |
| GET `/simulador` | simulador completo (home equity / compra), retoma simulação salva do visitante | público | `?produto=` | HTML | F01, F05 |
| POST `/api/simulacoes` | recalcula no servidor e grava a simulação anônima (visitante_id) | público, rate limit | dados da simulação | `{id, parcela, ...}` | F01 |
| POST `/api/leads` | cria/atualiza o lead pelo WhatsApp, liga as simulações do visitante, grava atribuição, escolhe vendedor (`proximo_vendedor()`), dispara `lead/criado` | público, rate limit + Turnstile | nome, WhatsApp, e-mail?, consentimento, simulacao_id? | `{lead_id, whatsapp_url}` | F01, F02 |
| GET `/w/[canal]` | grava o clique e redireciona para `wa.me/<número>?text=<mensagem + marcador>` | público | utm, gclid, fbclid | 302 | F06 |
| GET `/obrigado` | próximos passos + checklist + evento de conversão (com `event_id` igual ao da CAPI) | público | `?lead=` (opaco) | HTML | F01 |
| GET `/sitemap.xml`, `/robots.txt` | gerados | público | — | XML/texto | SEO |

### Portal de documentos

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET `/documentos` | tela de acesso (WhatsApp + código) | público | — | HTML | F07 |
| POST `/api/documentos/codigo/reenviar` | gera um código novo e envia pela UAZAPI se o número tiver lead com documentação liberada; resposta sempre igual (não revela se o número existe) | público, 3/h por número e 10/h por IP | WhatsApp | `{ok}` | F07 |
| POST `/api/documentos/entrar` | confere HMAC, validade, tentativas (5 → bloqueia); cria a sessão do cliente | público, rate limit | WhatsApp, código | cookie de sessão | F07 |
| GET `/documentos/enviar` | checklist + formulário de dados | sessão de cliente | — | HTML | F07 |
| PUT `/api/documentos/dados` | grava os dados cadastrais | sessão de cliente | zod (CPF válido etc.) | `{ok}` | F07 |
| POST `/api/documentos/upload-url` | URL assinada de upload (retomável) para um item | sessão de cliente | tipo, nome, tamanho, mime | `{url, path}` | F07 |
| POST `/api/documentos/upload-ok` | confirma o upload, checa tamanho e tipo real, marca o item "enviado", audita | sessão de cliente | path | `{item}` | F07 |
| POST `/api/documentos/concluir` | marca concluído e avisa o vendedor | sessão de cliente | — | `{ok}` | F07 |

### Painel (server actions com Supabase Auth + RLS)

| action | does | who | flow |
| --- | --- | --- | --- |
| `moverEtapa(lead, etapa, motivo?)` | muda a etapa (`app.ator`), trava a IA (`etapa_travada_humano`) | vendedor do lead / gestor | F08 |
| `enviarMensagem(conversa, texto/arquivo)` | envia pela UAZAPI, grava como `painel`, pausa o agente na conversa | vendedor do lead / gestor | F08 |
| `alternarAgente(escopo, id, ativo)` | liga/desliga global, por instância ou por conversa | gestor (global/instância), vendedor (conversa) | F11 |
| `liberarDocumentos(lead)` | cria os itens do checklist, gera o código, envia pela UAZAPI, move para Documentação | vendedor do lead / gestor | F07 |
| `revogarCodigo(lead)` / `reenviarCodigo(lead)` | — | vendedor do lead / gestor | F07 |
| `revisarDocumento(item, aprovado, motivo?)` | aprova/rejeita; se rejeitar, avisa o cliente pela UAZAPI | vendedor do lead / gestor | F07 |
| `baixarDocumento(item)` | gera URL assinada de 60 s e audita | vendedor do lead / gestor | F07 |
| `reatribuirLead(lead, usuario)` | troca o vendedor | gestor | — |
| `salvarConfig(chave, valor)` | simulador, regiões, horário, base do agente, alertas | gestor | — |
| `crudCanal`, `crudUsuario`, `crudDepoimento`, `lancarGasto` | cadastros | gestor | F09 |
| `conectarInstancia(usuario)` | cria/reconecta a instância na UAZAPI e devolve o QR code | gestor | — |
| `exportarLeads(filtro)` | CSV para públicos semelhantes (só qualificados/contratos), auditado | gestor | — |
| `excluirLead(lead)` | apaga o lead, as conversas e os arquivos (pedido LGPD), audita | gestor | — |

### Webhooks in

| path | from | does |
| --- | --- | --- |
| POST `/api/webhooks/uazapi/[instancia]?t=<segredo>` | UAZAPI | valida o segredo da instância; responde 200 em < 1 s e envia o evento ao Inngest (`whatsapp/evento`). Tipos: mensagem (entrada / `fromMe` do aparelho / enviada pela API), status de conexão, mensagem apagada/editada |
| POST `/api/webhooks/calcom` | Cal.com | valida a assinatura; cria/atualiza `agendamentos`, liga ao lead pelo telefone/e-mail |
| POST/GET `/api/inngest` | Inngest | endpoint das funções |

### Chamadas out

UAZAPI (enviar texto/mídia, presença "digitando", status da instância, QR), Claude API, transcrição,
Meta CAPI, Google Ads API, Meta Marketing API (gasto), Resend, Sentry.

### Jobs (Inngest)

| função | gatilho | o que faz |
| --- | --- | --- |
| `whatsapp/processar` | evento do webhook, **concurrency 1 por conversa** | normaliza o número, decide se é lead (telefone conhecido, marcador de link `/w/`, ou vendedor marcou), senão descarta sem gravar; grava a mensagem (idempotente); baixa a mídia para o Storage; se `fromMe` do aparelho → pausa o agente; atualiza `aguardando_resposta_desde` e `primeira_resposta_seg` |
| `whatsapp/transcrever` | mensagem de áudio | transcreve e grava `transcricao` |
| `ia/classificar` | mensagem nova, **debounce 60 s por lead** | Haiku: etapa sugerida, temperatura, resumo, próximo passo, dados extraídos; aplica só se `etapa_travada_humano = false` e só para frente até "Qualificado" (Documentação em diante é sempre ação humana ou do sistema) |
| `agente/responder` | mensagem do cliente, **debounce 8 s por conversa** (junta mensagens em sequência) | checa global + instância + conversa ativos, horário e limite de mensagens. Sonnet com as ferramentas `simular`, `consultar_base`, `atualizar_dados_lead`, `transferir_para_humano`. `step.sleep` de 4 a 12 s com presença "digitando", envia pela UAZAPI, grava `agente_log`. Antes de enviar, confere de novo se um humano respondeu no meio |
| `alertas/verificar` | cron a cada 5 min | lead quente sem resposta > 15 min, parado em Documentação > 3 dias, instância desconectada → alerta no WhatsApp do vendedor/gestor (pela UAZAPI) + e-mail |
| `conversoes/enviar` | cron a cada 10 min + evento | lê `conversoes_enviadas` pendentes; Meta CAPI (`event_id`, e-mail/telefone com hash, fbp/fbc); Google Ads (upload por gclid/gbraid/wbraid ou conversões avançadas com dados com hash); retentativa com backoff, registra o erro |
| `codigos/limpar` | cron diário | revoga códigos vencidos |
| `gastos/importar` | cron diário 06:00 BRT | importa o gasto do dia anterior (Google Ads API, Meta Marketing API) para `gastos_anuncio` |
| `instancias/status` | cron a cada 5 min | consulta o status das instâncias na UAZAPI e atualiza `instancias.status` |
| `lgpd/retencao` | cron semanal | anonimiza leads perdidos há mais de 12 meses (prazo a validar) e apaga documentos e mídias de quem não fechou |

## Agente de IA: desenho

- **Prompt de sistema** = regras fixas (código) + base de conhecimento (`configuracoes.agente_base`, editada
  no painel) + dados do lead e da última simulação. Regras fixas: apresentar-se como assistente virtual da
  Big; nunca prometer aprovação, taxa final ou prazo de liberação; não pedir documentos nem CPF no chat; ser
  breve (1 a 3 frases); perguntar 1 ou 2 dados por vez; ao faltar informação, chamar `transferir_para_humano`.
- **Ferramentas:** `simular` (usa `lib/financeiro` com a configuração do banco), `consultar_base`,
  `atualizar_dados_lead` (nome, cidade/UF, produto, valores), `transferir_para_humano(motivo, resumo)`.
- **Transferência:** lead qualificado, pedido de humano, reclamação, assunto fora da base, limite de
  mensagens. Ao transferir: pausa o agente na conversa e alerta o vendedor com resumo e simulação.
- **Proteção do número:** só responde a quem escreveu; nunca inicia conversa; atraso de 4 a 12 s com
  "digitando"; uma mensagem por vez; sem links encurtados.
- **Teste antes de ligar:** um conjunto de ~30 conversas roteirizadas (cliente fora da região, pede humano,
  manda áudio, tenta arrancar a "taxa final", vendedor entra no meio) roda em CI contra o prompt.

## The parts that bite

- **Fuso horário:** tudo em UTC no banco; exibição e regras de horário em `America/Sao_Paulo`. MS e MT estão
  1 h atrás de Brasília; o horário de atendimento segue o fuso de Brasília.
- **Idempotência:** o webhook da UAZAPI pode repetir → `unique (instancia_id, uazapi_message_id)` + insert
  `on conflict do nothing`. Conversões: `unique (lead, plataforma, evento)`. Cal.com: `externo_id` único.
- **Corridas:** o vendedor responde pelo celular enquanto o agente "digita" → o agente confere a conversa
  depois do sleep e antes de enviar, e aborta se houver mensagem do aparelho mais nova. Dois webhooks da mesma
  conversa → concurrency 1 por conversa no Inngest. Lead criado ao mesmo tempo pelo site e pelo WhatsApp →
  upsert em `whatsapp_e164`.
- **Normalização do telefone:** E.164 sempre. Celular com e sem o 9º dígito: o WhatsApp às vezes devolve o
  JID sem o 9 (números antigos). Comparar pelas duas formas antes de criar um lead novo.
- **Mensagens da API x do aparelho:** guardar o id de cada mensagem que o sistema envia e tratar como
  `aparelho` qualquer `fromMe` cujo id não está gravado. Só a mensagem do aparelho pausa o agente.
- **Privacidade (LGPD):** o filtro "é lead?" roda antes de qualquer gravação; contatos pessoais e grupos não
  tocam o banco. Documentos e mídias em bucket privado, download auditado. Retenção definida e exclusão a
  pedido (`excluirLead`).
- **Limites:** upload até 10 MB por arquivo, PDF/JPG/PNG/HEIC (HEIC convertido para JPG no servidor); upload
  retomável no 4G. Rate limit nas rotas públicas. Turnstile no formulário de lead.
- **Banimento na UAZAPI:** sem disparo frio, atraso humano, número reserva cadastrado e
  `instancias/status` alertando em 5 min. O histórico fica no banco, não no aparelho.
- **Google Ads API:** exige developer token (aprovação leva alguns dias) → pedir na semana 1. Enquanto não
  sai, as conversões offline vão por **importação agendada a partir de uma planilha do Google** (o job
  escreve a planilha), que o Google Ads aceita nativamente.
- **Meta:** CAPI e Pixel com o mesmo `event_id`; enviar `fbp`/`fbc` capturados no site. Leads que vieram só
  pelo WhatsApp têm correspondência mais fraca: enviar o telefone com hash.
- **Consentimento:** sem aceite de marketing, nada de Pixel/Ads no navegador (Consent Mode envia pings sem
  cookie); a CAPI só envia dados de quem consentiu no formulário.
- **SEO:** páginas de produto e blog estáticas; JSON-LD `FinancialService` + `Organization` (CNPJ, desde 2015,
  `areaServed` = 9 UFs, sem endereço residencial público), `FAQPage`, `BreadcrumbList`, `Article`; canonical
  em tudo; Core Web Vitals no orçamento (LCP < 2,5 s no 4G, imagens AVIF, fontes locais, JS do simulador
  carregado só quando visível).
- **Deliverability:** Resend com SPF, DKIM e DMARC no domínio antes do primeiro magic link.

## Build order (fase única, ~5 a 7 semanas)

Ordem pensada para o tráfego pago começar cedo: primeiro o que gera e mede lead, depois o que trabalha o lead.

1. **Fatia vertical (sem. 1):** home crua + `/simulador` (home equity, Price) → POST `/api/leads` → lead no banco
   → abre o WhatsApp do vendedor → a mensagem chega pela UAZAPI → aparece no inbox do painel.
   Telas: S10, S14, S16, S25, S27. Tabelas: `usuarios`, `instancias`, `leads`, `simulacoes`, `conversas`,
   `mensagens`, `configuracoes`. Rotas: `/api/simulacoes`, `/api/leads`, webhook UAZAPI, `whatsapp/processar`.
   Prova a stack inteira. Em paralelo: pedir o developer token do Google Ads; criar Supabase, Vercel,
   Inngest, Resend; registrar o domínio.
2. **Captação completa e medição (sem. 2):** simulador completo (SAC, carência, chips de taxa, LTV por
   produto, modo compra, calculadora de renda, retomar simulação), páginas de produto S11 a S13, `/w/[canal]`,
   atribuição, GTM + Consent Mode + GA4 + Pixel, `conversoes/enviar` (Lead), `/obrigado`, Turnstile,
   botão flutuante, 404. → **o degrau 1 do tráfego pode começar aqui.**
3. **Funil e painel (sem. 3):** kanban S29, ficha S28, `moverEtapa` + gatilho + conversões do funil (Meta CAPI,
   Google Ads), alertas, dashboard S30, conexões S31, configurações S32, papéis e RLS revisados.
4. **Documentos (sem. 4):** código, portal S17a/S17b, upload retomável, revisão, auditoria, Storage privado.
5. **IA (sem. 5):** transcrição, `ia/classificar`, agente S34 com ferramentas, guardrails, testes roteirizados;
   começa **desligado** e é ligado conversa por conversa, depois por vendedor.
6. **Conteúdo e confiança (em paralelo, sem. 2 a 6):** design final (/replica-design), Sobre, parceiros,
   contato, FAQ, depoimentos (só autorizados), blog com os 6 primeiros artigos, JSON-LD, sitemap,
   privacidade e termos, Google Meu Negócio.
7. **Fechamento (sem. 6 a 7):** /replica-test (E2E dos fluxos F01 a F11), Lighthouse, revisão de LGPD,
   /replica-deploy.
8. **Depois da entrega (`could`):** páginas por cidade, guia PDF, sequência de nutrição, teste A/B,
   integração com banco. Mais as correções que o /replica-entrepreneur trouxer.

## Pendências que não bloqueiam o início

- Confirmar a regra de juros da carência de 60 e 90 dias.
- Domínio (`bigassessoria.com.br`?) e o número de WhatsApp de cada vendedor.
- Validar com o contador o posicionamento ("consultora e representante de bancos parceiros").
- Prazo de retenção de documentos e de leads perdidos (sugestão: 12 meses).

## Infra criada (2026-10-14)

- Supabase: projeto **Big Assessoria**, ref `awlhzddymkhcvkgcrcji`, região **sa-east-1 (São Paulo)**, organização
  VozzyUP (plano free). URL da API: `https://awlhzddymkhcvkgcrcji.supabase.co`.
- Schema aplicado como migração `0001_init`: 21 tabelas com RLS, 5 configurações e 10 tipos de documento iniciais.
- Advisor de segurança: só 2 avisos, intencionais (`is_gestor` e `pode_ver_lead` precisam ser executáveis por
  usuários logados para as políticas de RLS funcionarem; retornam só um booleano sobre o próprio usuário).
- Plano free: projetos pausam após 7 dias sem uso e não têm backup diário. **Subir para Pro antes de receber
  leads reais** (dados de clientes e documentos).
- Chaves (anon/service role) ficam só em variáveis de ambiente; nunca no repositório.
