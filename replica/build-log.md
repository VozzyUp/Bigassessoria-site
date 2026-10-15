# Build log

| ID | data | estado | falta | o que foi mais difícil |
| --- | --- | --- | --- | --- |
| infra | 2026-10-14 | feito | Supabase Pro antes de receber lead real | schema aplicado como migração 0001_init, advisors só com 2 avisos intencionais |
| lib/financeiro | 2026-10-14 | feito | confirmar a regra da carência de 60/90 dias com o banco | 10 testes; R$ 6.319,54 e SAC R$ 8.033,33 conferidos |
| lib/telefone | 2026-10-14 | feito | — | 9º dígito: celulares antigos aparecem com e sem o 9 |
| S10 home | 2026-10-14 | parcial | fotos/ícones finais, prova social, depoimentos, JSON-LD | — |
| S11 a S13 produtos | 2026-10-14 | parcial | conteúdo próprio de cada página, FAQ, JSON-LD | — |
| S14 simulador | 2026-10-14 | parcial | SAC/Price comparativo completo, modo compra com entrada e renda, retomar simulação | grid com input estourando o card (corrigido) |
| S16 obrigado | 2026-10-14 | parcial | disparo da conversão (GA4/Ads/Meta) | — |
| S25 login | 2026-10-14 | parcial | usuários do painel (depende do e-mail dos vendedores) | — |
| S28/S29 ficha e funil | 2026-10-15 | parcial | arrastar e soltar, tempo real, editar dados; nada testado com usuário logado (precisa criar usuários) | RLS faz o vendedor ver só os leads dele |
| medição | 2026-10-15 | parcial | criar o container no GTM e as tags (GA4, Google Ads, Meta); CAPI e Google Ads API ainda não | banner testado: recusar grava a escolha e some |
| S22 FAQ + JSON-LD | 2026-10-15 | feito | revisar as respostas com o cliente | — |
| S27 inbox | 2026-10-14 | parcial | tela da conversa, responder pelo painel, tempo real | — |
| S33 /w/[canal] | 2026-10-14 | feito | testar de ponta a ponta com a service role | — |
| webhook UAZAPI | 2026-10-14 | parcial | conferir formato real na documentação da instância; teste com número real | formato do payload é a maior incerteza |
| /api/leads | 2026-10-14 | parcial | teste de ponta a ponta (precisa da SUPABASE_SERVICE_ROLE_KEY) | — |
| deploy | 2026-10-14 | feito (arquivos) | primeira subida no Portainer | Docker não instalado nesta máquina: a imagem ainda não foi construída aqui |

## Decisões e desvios

- Next.js 16 vem com Cache Components ligado por padrão; desliguei (projeto estático/ISR clássico).
- Hospedagem mudou de Vercel para a VPS do cliente via Portainer (imagem Docker, build standalone).
- Webhook processa inline (sem Inngest) nesta fatia. Antes de ligar o agente de IA, mover para Inngest
  (fila, debounce, atraso humano).
- Rate limit em memória: trocar por Redis antes de produção com várias réplicas.
- Política de privacidade e termos são rascunho: precisam de revisão jurídica antes dos anúncios.
- Teste das regras do banco (gatilho de etapa, unicidade de código) foi escrito e NÃO executado: o usuário
  interrompeu a execução. Rodar quando autorizado.

## Rodada final (2026-10-15)

| área | estado | o que falta |
| --- | --- | --- |
| Conversões Meta CAPI e Google Ads | feito (código) | Meta: pixel e token; Google: developer token aprovado, OAuth e nomes das ações de conversão |
| Documentos por código | feito | teste de ponta a ponta com a service role e a UAZAPI |
| Painel (funil, ficha, documentos, resposta, dashboard, agente, conexões, configurações, equipe) | feito | arrastar e soltar no funil, tempo real, QR code dentro do painel |
| Agente de IA e classificação | feito (desligado por padrão) | chave ANTHROPIC_API_KEY, 30 conversas de teste antes de ligar |
| Blog (4 artigos), Sobre, Contato, FAQ, 404 | feito | revisão do cliente; mais artigos; depoimentos reais |
| Medição | feito (eventos e consentimento) | criar o container GTM e as tags |

**Não implementado:** transcrição de áudio e download de mídia do WhatsApp (depende do formato da UAZAPI), página de parceiros
(depende da autorização dos bancos), prova social, agendamento de ligação, importação automática do gasto, retomar simulação,
calculadora de capacidade pela renda.

**Verificado:** 71 testes automáticos, tipos, lint e build limpos; todas as rotas respondem; sem rolagem horizontal em 390 px
nas páginas públicas; rate limit, consentimento e guardas de gestor conferidos por leitura de código.

**Nunca executado de ponta a ponta** (faltam chaves e a UAZAPI): gravação de lead, webhook, envio de código, upload de documento,
conversões, agente de IA e alertas. O primeiro teste real é a subida no Portainer.

## Medições (2026-10-15, localhost, build de produção)

- Lighthouse mobile na home: acessibilidade 100, boas práticas 100, SEO 100 (corrigidos contraste do subtítulo do logo, ordem dos títulos do rodapé e nome acessível do link do logo).
- Traço de desempenho (celular 390 px, 4G rápido, CPU 4x mais lenta): LCP 578 ms, CLS 0,00. Na VPS soma-se a latência real da rede: medir de novo com o domínio no ar.
- 79 testes automáticos passando; tipos, lint e build limpos.

## Novidades desta rodada

Funil com arrastar e soltar; calculadora "quanto posso financiar"; retomar a última simulação; campo de melhor horário;
depoimentos com cadastro, autorização e publicação; importação de gasto da Meta e do Google (precisa das credenciais).
