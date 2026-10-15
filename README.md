# Big Assessoria: site e painel comercial

Site de captação de crédito imobiliário (simulador, páginas de produto, blog) e painel comercial (funil, conversas do WhatsApp, documentos por código, agente de IA, dashboard).
Next.js 16, Tailwind 4, Supabase (Postgres, Auth, Storage), UAZAPI, Claude API.

Documentação do projeto, decisões e plano: pasta `replica/` (`recon.md`, `architecture.md`, `trafego-pago.md`, `build-log.md`).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # http://localhost:3000
npm test                     # testes
npm run build                # build de produção
```

## Subir no Portainer (VPS)

1. Portainer > Stacks > Add stack > **Repository**: `https://github.com/VozzyUp/Bigassessoria-site`, branch `main`, arquivo `docker-compose.yml`.
2. Em **Environment variables**, preencha (valores no `.env.example`):
   - Públicas (entram no build): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`.
   - Secretas: `SUPABASE_SERVICE_ROLE_KEY`, `UAZAPI_WEBHOOK_SECRET`, `DOCUMENTOS_SECRET` (24+ caracteres), `HASH_SALT`, `ANTHROPIC_API_KEY`, `WHATSAPP_PUBLICO`.
   - Anúncios (quando prontos): `META_PIXEL_ID`, `META_CAPI_TOKEN`, `GOOGLE_ADS_*`.
   - `JOBS_ATIVOS=true` (conversões e alertas rodam dentro do container; use **uma réplica só**).
3. Ajuste os rótulos do proxy (Traefik ou outro) no `docker-compose.yml` para o domínio.
4. Deploy. Teste `https://SEU-DOMINIO/robots.txt`.

## Primeiros passos depois do deploy

1. Criar o primeiro gestor: `node --env-file=.env.local scripts/criar-gestor.mjs "Nome" email senha` (precisa da service role).
2. Entrar em `/painel/login`, criar os vendedores em **Equipe** (com o WhatsApp para alertas).
3. Em **Conexões**, cadastrar o número de cada vendedor (instância e token da UAZAPI) e colar o endereço do webhook na UAZAPI.
4. Em **Configurações**, conferir taxa mínima, percentuais do imóvel, prazos e estados.
5. Em **Agente de IA**, revisar a base de conhecimento. Ele começa **desligado**: ligue por número e depois geral.
6. No GTM, publicar o container e criar as tags (GA4, Google Ads, Meta) usando os eventos `simulacao_concluida` e `generate_lead`.

## Banco de dados

Migrações aplicadas no projeto Supabase `awlhzddymkhcvkgcrcji` (`0001_init`, `0002_ator_da_etapa`, `0003_vault_buckets_consentimento`). O rascunho em `replica/schema.sql` difere só no endurecimento de segurança. Para versionar o SQL final no repositório: `supabase db pull`.

## Segurança

- Nenhuma chave no Git (`.env*` ignorados). A service role só roda no servidor.
- Documentos em bucket privado, leitura por URL assinada de 60 s com registro de auditoria.
- Código de acesso: 6 dígitos, HMAC com o telefone, vale 24 h, bloqueia após 5 erros.
- Política de privacidade e termos são **rascunhos**: precisam de revisão jurídica antes de anunciar.
