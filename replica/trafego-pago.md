# Rastreamento e tráfego pago: Big Assessoria

Date: 2026-10-14. Base para /replica-architect (o que medir) e /replica-launch (como anunciar).

## O princípio que decide se o dinheiro rende

Crédito imobiliário gera muito lead ruim: curioso, imóvel fora da região, imóvel não quitado sem margem,
quem só quer saber a taxa. Se o Google e a Meta aprendem com o evento "preencheu o formulário", eles trazem
**mais gente igual a quem preenche formulário**, e não a quem fecha.

Por isso o sistema devolve aos anúncios **o que aconteceu depois**: lead qualificado, documentação,
proposta, liberado. As plataformas passam a procurar gente parecida com quem chegou à proposta. Esse é o
maior ganho de eficiência disponível, e a ZAFF não faz.

## 1. Medição (vai no código, fase única)

| camada | o quê | por quê |
| --- | --- | --- |
| Consentimento | banner LGPD + Google Consent Mode v2 | sem isso o Google perde dados de quem recusa e a conta fica exposta |
| Tag manager | GTM no site | trocar tags sem deploy |
| Analytics | GA4 com eventos: `simulacao_iniciada`, `simulacao_concluida`, `lead`, `clique_whatsapp`, `documentos_enviados` | ver onde o funil vaza no site |
| Google Ads | conversão `Lead` no site + **conversões avançadas para leads** (e-mail/telefone com hash) + **importação offline** das etapas | otimizar por qualidade |
| Meta | Pixel no navegador + **Conversions API** no servidor, mesmo `event_id` (deduplicação) | o iOS e os bloqueadores cortam o pixel; o servidor não perde |
| Identificadores | gravar no lead: `gclid`, `gbraid`, `wbraid`, `fbclid`, `_fbp`, `_fbc`, UTMs, landing page, primeiro e último toque | sem isso não há como devolver a conversão ao anúncio certo |
| Links `/w/[canal]` | cada canal e cada campanha que leva direto ao WhatsApp tem seu link | atribuir também quem nunca passou pelo simulador |
| Gasto | importado das APIs (should) ou digitado no painel | calcular custo por etapa no dashboard |

### Eventos devolvidos às plataformas

| etapa no painel | Google Ads (offline) | Meta (CAPI) | valor sugerido |
| --- | --- | --- | --- |
| Novo lead | `Lead` (já no site) | `Lead` | 0 ou baixo |
| Qualificado | `Lead qualificado` | `QualifiedLead` (evento custom) | receita média × prob. de fechar a partir daqui |
| Documentação | `Documentação` | `SubmitApplication` | idem, prob. maior |
| Proposta | `Proposta` | `Proposal` (custom) | idem |
| Liberado | `Contrato` | `Purchase` | receita real da Big na operação |

**Preciso do cliente:** receita média da Big por operação (comissão ou fee) e uma estimativa de quantos
leads qualificados viram contrato. Com isso calculamos o CAC máximo e o valor de cada etapa:

```
CAC máximo            = receita média por operação × % que aceita gastar em aquisição
custo máx. por lead Q = CAC máximo × (taxa lead qualificado → contrato)
```

## 2. Google Ads: começar por aqui

Busca é intenção: quem pesquisa "empréstimo com garantia de imóvel" já quer o produto.

- **Campanhas de Pesquisa** separadas por produto, cada uma com sua landing:
  - Home equity → `/credito-com-garantia-de-imovel`: home equity, empréstimo com garantia de imóvel,
    crédito com garantia de imóvel, refinanciamento de imóvel, empréstimo com imóvel em garantia
  - Financiamento → `/financiamento-imobiliario`: financiamento imobiliário, simulação de financiamento,
    assessoria de financiamento imobiliário
  - Portabilidade → `/portabilidade-de-financiamento`: portabilidade de financiamento imobiliário,
    baixar parcela do financiamento
- **Correspondência:** começar com frase e exata. Abrir a ampla só depois que a otimização estiver
  recebendo conversões de qualidade.
- **Negativas desde o dia 1:** emprego, vaga, curso, o que é, pdf, consignado, FGTS (se não atendem),
  nomes de bancos (se não quiserem disputar marca de banco), e outras que a revisão semanal de termos
  de pesquisa mostrar.
- **Geo:** as 9 UFs com "presença" (pessoas que estão na região), não "interesse". Aumentar o lance nas
  capitais e polos com imóveis de maior valor.
- **Lances:** semanas 1-2 em Maximizar conversões no `Lead`. Quando houver ~30 leads qualificados por mês,
  mudar o objetivo para `Lead qualificado`. Com volume de propostas, partir para lances por valor.
- **Recursos do anúncio:** sitelinks (simulador, como funciona, documentos, sobre), frases de destaque,
  snippets estruturados, chamada. Texto sempre "a partir de", nunca promessa de aprovação.
- **Verificação:** o Google pode exigir verificação de anunciante e de serviços financeiros. Ter o CNPJ
  e os documentos prontos antes de subir as campanhas.
- **Google Meu Negócio:** perfil completo + pedir avaliação a cada contrato liberado. Isso ajuda no mapa e
  no orgânico, e o tráfego vem pelo link `/w/google-meu-negocio`.

## 3. Meta (Instagram e Facebook): segunda frente

A Meta cria demanda (a pessoa não estava procurando), então converte menos por clique mas escala.

- **Categoria especial:** anúncios de crédito podem ser obrigados a usar a categoria especial de produtos
  financeiros, que limita a segmentação por idade, gênero e CEP. Contar com público amplo. Mais um motivo
  para otimizar pelo evento de qualidade da CAPI, que faz a segmentação por você.
- **Campanha 1: leads no site.** Objetivo Leads, destino o simulador, otimizar em `Lead` no início e em
  `QualifiedLead` quando houver volume (~50 eventos/semana por conjunto é o ideal da Meta; abaixo disso,
  agrupar).
- **Campanha 2: clique para o WhatsApp (teste).** O anúncio abre o WhatsApp do vendedor com uma mensagem
  marcada por campanha. Atenção: com a UAZAPI, os dados do anúncio de origem podem não vir completos. A
  mensagem marcada garante o canal, mas a devolução da conversão à Meta fica mais fraca que no simulador.
  Comparar o custo por lead qualificado das duas antes de escalar.
- **Remarketing:** quem iniciou a simulação e não deixou contato, e quem viu a página de produto. Janela de
  7 a 30 dias, criativo com a parcela de exemplo e prova social.
- **Públicos semelhantes:** a partir da lista de leads qualificados e contratos (exportada do painel), não da
  lista de todos os leads.
- **Ângulos de criativo:** quitar dívidas caras (cartão, cheque especial), capital de giro para empresário,
  reforma ou construção, comprar outro imóvel. Cada ângulo é um conjunto de anúncios; quem traz lead
  qualificado mais barato fica.

## 4. Começar pequeno e escalar com dados (decisão do cliente)

O cliente ainda não tem receita média por operação e quer começar aos poucos. Então a escada abaixo usa
**marcos de resultado** para liberar o próximo degrau, e não datas. Os valores são ponto de partida, não regra.

| degrau | o que roda | verba sugerida | sobe para o próximo quando |
| --- | --- | --- | --- |
| 0. Fundação (antes de gastar) | site no ar, conversões testadas de ponta a ponta (lead de teste aparece no Google Ads e na Meta), Google Meu Negócio, negativas prontas | R$ 0 | todas as conversões chegam certas |
| 1. Validação | **só Google Pesquisa, só home equity**, em 3 UFs (sugestão: RS, SC, PR, onde a Big tem base e o clique costuma ser mais barato que em SP/RJ) | ~R$ 50/dia (~R$ 1.500/mês) | 4 semanas + pelo menos 1 operação em documentação ou proposta + custo por lead qualificado conhecido |
| 2. Ampliação | + financiamento e portabilidade no Google; + mais UFs (SP e MG primeiro); remarketing na Meta | ~R$ 100/dia | custo por qualificado estável ou caindo por 2 a 3 semanas |
| 3. Demanda | + Meta leads no site (otimizando em `QualifiedLead`) e teste de clique para WhatsApp; todas as 9 UFs | ~R$ 150 a 250/dia | primeiras operações liberadas → calcular a receita média e o CAC real |
| 4. Escala por valor | lances por valor no Google, públicos semelhantes de contratos na Meta, verba guiada pelo CAC | conforme o CAC | — |

Sem receita média, a meta provisória é o **custo por lead qualificado**. Depois das 3 a 5 primeiras operações
liberadas, o painel passa a mostrar o CAC real, e a verba passa a ser decidida pela regra
"cada R$ 1 investido volta R$ X".

**Antes de gastar o primeiro real:** o agente de IA e os vendedores precisam responder em minutos. Pagar por um
lead e responder em 2 horas é jogar a verba fora.

## 4b. Distribuição quando todas as frentes estiverem rodando (degrau 3 em diante)

Sem histórico, comece concentrado e deixe os dados decidirem:

| frente | início | regra para mudar |
| --- | --- | --- |
| Google Pesquisa | ~60% | escala enquanto o custo por lead qualificado estiver abaixo da meta |
| Meta: leads no site | ~30% | se o custo por qualificado ficar até ~1,5× o do Google, vale (volume) |
| Remarketing | ~10% | limitado pelo tamanho do público |
| Clique para WhatsApp | teste dentro dos 30% da Meta | só escala se empatar com o simulador em lead qualificado |

**Ritmo:** 2 semanas de aprendizado sem mexer muito. Depois disso, revisão semanal:
1. Termos de pesquisa → negativar o lixo.
2. Custo por **lead qualificado** por campanha (não por lead): cortar o pior 20%, pôr verba no melhor.
3. Tempo de primeira resposta dos vendedores. Lead de crédito esfria em minutos; se a resposta passa de
   15 min, o problema não é o anúncio.
4. Motivos de perda: "fora da região" alto = geo errada; "taxa" alto = expectativa errada no anúncio;
   "sem retorno" alto = atendimento.

## 5. Painel: números que o gestor vê toda semana

- Leads, qualificados, documentação, propostas, contratos, por canal e por campanha
- CPL, custo por qualificado, custo por proposta, CAC, e receita/gasto
- Taxa de conversão entre cada etapa e tempo médio em cada uma
- Tempo de primeira resposta e conversão por vendedor
- Motivos de perda

## Pendências do cliente para começar a anunciar

- ~~CNPJ~~ recebido: 22.309.209/0001-74
- Receita média por operação (calcular após as primeiras operações; ver degraus)
- ~~Taxa e LTV~~ recebidos: a partir de 1,19% a.m. + IPCA; home equity 60%, financiamento 80%
- ~~Acessos~~: administrador único (Fernando)
- Verba mensal inicial
