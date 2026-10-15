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
