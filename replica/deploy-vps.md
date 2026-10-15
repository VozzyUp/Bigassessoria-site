# Implantação na VPS (Portainer, Docker Swarm, Traefik)

Domínio: **big.vozzyup.com.br**. Imagem: `ghcr.io/vozzyup/bigassessoria-site:latest`, construída pelo GitHub.

## 1. Imagem (automático)

O arquivo `.github/workflows/docker.yml` constrói e publica a imagem a cada push na `main`.
- Acompanhe em GitHub > Actions > "Imagem Docker". Leva uns 3 a 5 minutos.
- Depois do primeiro build, em GitHub > seu perfil/organização > Packages > `bigassessoria-site` > Package settings,
  deixe a visibilidade igual à da imagem do Cabeça Leve (pública, ou privada com o registro `ghcr.io` cadastrado no Portainer).
- Os valores públicos do build (URL do Supabase, chave publicável, URL do site, GTM) têm padrão no workflow.
  Para trocar o GTM depois: GitHub > Settings > Secrets and variables > Actions > Variables > `NEXT_PUBLIC_GTM_ID`.

## 2. DNS

Aponte `big.vozzyup.com.br` (registro A) para o IP da VPS, igual ao domínio do Cabeça Leve. Espere propagar antes de subir a stack.

## 3. Stack no Portainer

1. Stacks > Add stack > nome `bigassessoria` > **Web editor** > cole o conteúdo de `docker-compose.yml`.
2. Environment variables > Advanced mode > cole o conteúdo de `deploy/stack.env` (a cópia preenchida, fora do Git).
3. Preencha `TRAEFIK_NETWORK` (e, se forem diferentes, `TRAEFIK_ENTRYPOINT` e `TRAEFIK_CERTRESOLVER`) com os mesmos valores da stack do Cabeça Leve.
4. Deploy. Conferir: `https://big.vozzyup.com.br/robots.txt` responde, e `/painel/login` abre.

## 4. Primeiro acesso

No seu computador, com `.env.local` preenchido:

```
node --env-file=.env.local scripts/criar-gestor.mjs "Fernando" seu@email.com "senha-temporaria-longa"
```

Entre em `/painel/login` e troque a senha em **Minha senha**. Depois crie os vendedores em **Equipe**.

## 5. WhatsApp (UAZAPI)

1. Preencha `UAZAPI_BASE_URL` na stack.
2. Painel > Conexões > cadastrar o número de cada vendedor (nome da instância e token).
3. Na UAZAPI, configure o webhook da instância para `https://big.vozzyup.com.br/api/webhooks/uazapi/NOME-DA-INSTANCIA?t=VALOR_DE_UAZAPI_WEBHOOK_SECRET`.
4. Envie uma mensagem de teste e confira em Painel > Conversas.

## 6. Agente de IA

Preencha `ANTHROPIC_API_KEY`, revise a base em Painel > Agente de IA e ligue **por número** primeiro, depois no geral.

## Atualizar

Push na `main` > GitHub constrói a imagem > no Portainer, na stack, **Update the stack** com "Re-pull image" marcado.
