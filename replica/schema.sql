-- ATENÇÃO: a versão aplicada é a migração 0001_init do projeto Supabase "Big Assessoria" (ref awlhzddymkhcvkgcrcji).
-- Ela difere deste rascunho só em endurecimento: policies "to authenticated", (select auth.uid()), search_path nas funções,
-- índices extras nas FKs e revoke de execute das funções internas. No /replica-build, trazer o SQL final com `supabase db pull`.
-- Big Assessoria: schema inicial (Postgres / Supabase)
-- Origem: replica/recon.md + replica/features.csv (2026-10-14)
-- Convenções: uuid, timestamptz em UTC, dinheiro em centavos (bigint, BRL), taxas em numeric.
-- Acesso: RLS no Supabase para o painel (vendedor vê os seus, gestor vê tudo).
-- O site público, os webhooks e os jobs escrevem pelo servidor com a service role (nunca pelo navegador).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type papel_usuario   as enum ('vendedor', 'gestor');
create type produto_credito as enum ('home_equity', 'financiamento', 'portabilidade', 'outro');
create type etapa_funil     as enum ('novo', 'em_atendimento', 'qualificado', 'documentacao',
                                     'analise', 'proposta', 'contrato', 'liberado', 'perdido');
create type motivo_perda    as enum ('taxa', 'desistencia', 'reprovacao', 'sem_retorno',
                                     'fora_regiao', 'sem_garantia', 'outro');
create type tipo_canal      as enum ('google_ads', 'meta_ads', 'instagram', 'facebook',
                                     'google_meu_negocio', 'site_organico', 'parceiro',
                                     'indicacao', 'direto', 'outro');
create type sistema_amort   as enum ('price', 'sac');
create type status_item_doc as enum ('pendente', 'enviado', 'aprovado', 'rejeitado');

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- Equipe e conexões WhatsApp
-- ---------------------------------------------------------------------------
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  papel papel_usuario not null default 'vendedor',
  whatsapp_alerta text,                              -- E.164, recebe os alertas
  ativo boolean not null default true,
  recebe_leads_site boolean not null default true,   -- entra no rodízio de leads do site
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger usuarios_updated before update on usuarios for each row execute function set_updated_at();

create table instancias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete restrict,
  uazapi_instance text not null unique,              -- nome/id da instância na UAZAPI
  uazapi_token_secret_id uuid,                       -- referência ao Supabase Vault; o token nunca fica em texto
  numero_e164 text,
  status text not null default 'desconectada' check (status in ('conectada', 'desconectada', 'conectando')),
  agente_ativo boolean not null default false,
  ultimo_evento_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on instancias (usuario_id);
create trigger instancias_updated before update on instancias for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Canais, links rastreáveis e cliques
-- ---------------------------------------------------------------------------
create table canais (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),   -- /w/[slug]
  tipo tipo_canal not null,
  nome text not null,
  parceiro text,
  marcador text not null unique,                     -- texto curto na mensagem, ex.: "(ref IG1)"
  mensagem text not null,                            -- mensagem pré-preenchida
  usuario_id uuid references usuarios(id) on delete set null,   -- vendedor de destino; null = rodízio
  utm jsonb not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger canais_updated before update on canais for each row execute function set_updated_at();

create table cliques (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references canais(id) on delete cascade,
  visitante_id text,                                 -- cookie primário do site
  gclid text, gbraid text, wbraid text, fbclid text, fbp text, fbc text,
  utm jsonb not null default '{}',
  landing_page text,
  user_agent text,
  ip_hash text,                                      -- hash com sal, nunca o IP cru
  created_at timestamptz not null default now()
);
create index on cliques (canal_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  whatsapp_e164 text not null unique check (whatsapp_e164 ~ '^\+55[1-9][0-9]{9,10}$'),
  nome text,
  email text,
  cidade text,
  uf char(2),
  fora_regiao boolean not null default false,
  produto produto_credito,
  usuario_id uuid references usuarios(id) on delete set null,   -- vendedor responsável
  etapa etapa_funil not null default 'novo',
  etapa_em timestamptz not null default now(),
  etapa_travada_humano boolean not null default false,          -- a IA não muda mais a etapa
  temperatura smallint check (temperatura between 0 and 100),
  resumo_ia text,
  proximo_passo_ia text,
  motivo_perda motivo_perda,
  motivo_perda_texto text,
  valor_operacao_centavos bigint check (valor_operacao_centavos >= 0),
  receita_centavos bigint check (receita_centavos >= 0),        -- o que a Big ganha, para CAC/ROAS
  melhor_horario text,
  -- atribuição
  canal_id uuid references canais(id) on delete set null,
  primeiro_toque jsonb not null default '{}',                   -- {utm, gclid, fbclid, fbp, fbc, landing, at}
  ultimo_toque jsonb not null default '{}',
  gclid text, gbraid text, wbraid text, fbp text, fbc text,
  visitante_id text,
  consentimento_lgpd_em timestamptz,
  consentimento_marketing boolean not null default false,
  ultimo_contato_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint perda_tem_motivo check (etapa <> 'perdido' or motivo_perda is not null)
);
create index on leads (usuario_id, etapa);
create index on leads (etapa, etapa_em);
create index on leads (canal_id, created_at desc);
create index on leads (created_at desc);
create index on leads (temperatura desc) where etapa not in ('liberado', 'perdido');
create trigger leads_updated before update on leads for each row execute function set_updated_at();

create table simulacoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,          -- null até o visitante deixar o contato
  visitante_id text,
  produto produto_credito not null,
  tipo_imovel text check (tipo_imovel in ('casa', 'apartamento', 'terreno', 'comercial', 'outro')),
  valor_imovel_centavos bigint not null check (valor_imovel_centavos > 0),
  situacao_imovel text check (situacao_imovel in ('quitado', 'financiado')),
  saldo_devedor_centavos bigint check (saldo_devedor_centavos >= 0),
  valor_credito_centavos bigint not null check (valor_credito_centavos > 0),
  entrada_centavos bigint check (entrada_centavos >= 0),        -- modo compra
  renda_mensal_centavos bigint check (renda_mensal_centavos >= 0),
  idade smallint check (idade between 18 and 90),
  prazo_meses smallint not null check (prazo_meses between 12 and 420),
  carencia_dias smallint not null default 30 check (carencia_dias in (30, 60, 90)),
  taxa_mensal numeric(6,4) not null check (taxa_mensal > 0),    -- 0.0119 = 1,19% a.m.
  indexador text not null default 'IPCA',
  sistema sistema_amort not null,
  parcela_centavos bigint not null,                             -- Price: fixa; SAC: primeira
  ultima_parcela_centavos bigint,                               -- SAC
  ltv numeric(5,4) not null,                                    -- 0.6000
  finalidade text,
  urgencia text check (urgencia in ('30d', '1-3m', '3-6m', 'planejando')),
  uf char(2), cidade text,
  origem text not null default 'site' check (origem in ('site', 'agente_ia', 'painel')),
  created_at timestamptz not null default now()
);
create index on simulacoes (lead_id, created_at desc);
create index on simulacoes (visitante_id) where lead_id is null;

-- ---------------------------------------------------------------------------
-- Conversas WhatsApp (UAZAPI)
-- ---------------------------------------------------------------------------
create table conversas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  instancia_id uuid not null references instancias(id) on delete restrict,
  ultima_mensagem_em timestamptz,
  aguardando_resposta_desde timestamptz,             -- última msg do cliente ainda sem resposta
  primeira_resposta_seg integer,
  agente_ativo boolean not null default true,        -- liga/desliga por conversa
  agente_pausado_por text check (agente_pausado_por in ('vendedor', 'gestor', 'transferencia', 'limite')),
  agente_pausado_em timestamptz,
  agente_msgs_enviadas smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, instancia_id)
);
create index on conversas (instancia_id, ultima_mensagem_em desc);
create index on conversas (aguardando_resposta_desde) where aguardando_resposta_desde is not null;
create trigger conversas_updated before update on conversas for each row execute function set_updated_at();

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references conversas(id) on delete cascade,
  instancia_id uuid not null references instancias(id) on delete restrict,
  uazapi_message_id text not null,
  direcao text not null check (direcao in ('entrada', 'saida')),
  enviado_por text not null check (enviado_por in ('cliente', 'aparelho', 'painel', 'agente_ia', 'sistema')),
  tipo text not null check (tipo in ('texto', 'audio', 'imagem', 'documento', 'video', 'chamada', 'outro')),
  texto text,
  transcricao text,
  midia_path text,                                   -- Storage privado
  enviado_em timestamptz not null,
  apagada boolean not null default false,
  editada boolean not null default false,
  created_at timestamptz not null default now(),
  unique (instancia_id, uazapi_message_id)           -- idempotência do webhook
);
create index on mensagens (conversa_id, enviado_em);

create table classificacoes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  etapa_sugerida etapa_funil,
  temperatura smallint check (temperatura between 0 and 100),
  resumo text,
  proximo_passo text,
  dados_extraidos jsonb not null default '{}',       -- campos de qualificação que a IA achou
  modelo text not null,
  tokens_in integer, tokens_out integer,
  aplicada boolean not null default false,           -- false quando o humano travou a etapa
  created_at timestamptz not null default now()
);
create index on classificacoes (lead_id, created_at desc);

create table etapa_historico (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  de etapa_funil,
  para etapa_funil not null,
  por text not null check (por in ('ia', 'vendedor', 'gestor', 'sistema')),
  usuario_id uuid references usuarios(id) on delete set null,
  motivo_perda motivo_perda,
  created_at timestamptz not null default now()
);
create index on etapa_historico (lead_id, created_at);
create index on etapa_historico (para, created_at);

create table agente_log (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references conversas(id) on delete cascade,
  mensagem_entrada_id uuid references mensagens(id) on delete set null,
  resposta text,
  ferramentas jsonb not null default '[]',
  transferiu boolean not null default false,
  motivo_transferencia text,
  modelo text not null,
  tokens_in integer, tokens_out integer,
  custo_micro_usd bigint,
  created_at timestamptz not null default now()
);
create index on agente_log (conversa_id, created_at);

-- ---------------------------------------------------------------------------
-- Documentos por código
-- ---------------------------------------------------------------------------
create table codigos_acesso (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  whatsapp_e164 text not null,
  codigo_hash text not null,                         -- HMAC-SHA256(código, segredo do servidor)
  expira_em timestamptz not null,
  tentativas smallint not null default 0,
  usado_em timestamptz,
  revogado_em timestamptz,
  criado_por uuid references usuarios(id) on delete set null,   -- null = sistema
  created_at timestamptz not null default now()
);
create index on codigos_acesso (whatsapp_e164, created_at desc);
create unique index codigo_ativo_por_lead on codigos_acesso (lead_id)   -- no máximo um código válido por lead
  where usado_em is null and revogado_em is null;

create table documento_tipos (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  nome text not null,
  grupo text not null check (grupo in ('pessoais', 'renda', 'imovel', 'outros')),
  obrigatorio boolean not null default true,
  so_se_financiado boolean not null default false,
  ordem smallint not null default 0,
  ativo boolean not null default true
);

create table documento_itens (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  tipo_id uuid not null references documento_tipos(id) on delete restrict,
  status status_item_doc not null default 'pendente',
  motivo_rejeicao text,
  arquivos text[] not null default '{}',             -- paths no bucket privado "documentos"
  enviado_em timestamptz,
  revisado_por uuid references usuarios(id) on delete set null,
  revisado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, tipo_id)
);
create index on documento_itens (lead_id);
create trigger documento_itens_updated before update on documento_itens for each row execute function set_updated_at();

create table dados_cadastrais (
  lead_id uuid primary key references leads(id) on delete cascade,
  cpf text check (cpf ~ '^[0-9]{11}$'),
  data_nascimento date,
  estado_civil text,
  profissao text,
  endereco jsonb not null default '{}',
  conjuge jsonb,
  imovel jsonb not null default '{}',                -- endereço, matrícula, cartório
  updated_at timestamptz not null default now()
);
create trigger dados_cadastrais_updated before update on dados_cadastrais for each row execute function set_updated_at();

create table audit_log (
  id bigint generated always as identity primary key,
  lead_id uuid references leads(id) on delete set null,
  ator text not null check (ator in ('cliente', 'usuario', 'sistema', 'agente_ia')),
  usuario_id uuid references usuarios(id) on delete set null,
  acao text not null,              -- codigo.enviado, codigo.falhou, codigo.bloqueado, doc.upload, doc.download, lead.export
  detalhes jsonb not null default '{}',
  ip_hash text,
  created_at timestamptz not null default now()
);
create index on audit_log (lead_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Rastreamento de anúncios
-- ---------------------------------------------------------------------------
create table conversoes_enviadas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  plataforma text not null check (plataforma in ('google_ads', 'meta')),
  evento text not null,                              -- Lead, QualifiedLead, SubmitApplication, Proposal, Purchase
  event_id text not null,                            -- deduplicação Pixel x CAPI
  valor_centavos bigint,
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'erro', 'ignorado')),
  tentativas smallint not null default 0,
  erro text,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (lead_id, plataforma, evento)               -- cada etapa sai uma vez por plataforma
);
create index on conversoes_enviadas (status, created_at) where status in ('pendente', 'erro');

create table gastos_anuncio (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null check (plataforma in ('google_ads', 'meta', 'outro')),
  campanha text not null,
  dia date not null,
  valor_centavos bigint not null check (valor_centavos >= 0),
  origem text not null default 'manual' check (origem in ('manual', 'api')),
  created_at timestamptz not null default now(),
  unique (plataforma, campanha, dia)
);

-- ---------------------------------------------------------------------------
-- Conteúdo e configuração editáveis no painel
-- ---------------------------------------------------------------------------
create table configuracoes (
  chave text primary key,                            -- simulador, regioes, agente, agente_base, horario, alertas
  valor jsonb not null,
  updated_by uuid references usuarios(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table depoimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,                                -- como o cliente autorizou aparecer
  cidade text, uf char(2),
  texto text not null,
  nota smallint check (nota between 1 and 5),
  fonte text check (fonte in ('google', 'whatsapp', 'outro')),
  autorizacao_em timestamptz not null,               -- só existe com autorização registrada
  publicado boolean not null default false,
  ordem smallint not null default 0,
  created_at timestamptz not null default now()
);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  externo_id text unique,                            -- id do Cal.com
  inicio timestamptz not null,
  fim timestamptz not null,
  status text not null default 'confirmado' check (status in ('confirmado', 'cancelado', 'remarcado')),
  created_at timestamptz not null default now(),
  check (fim > inicio)
);
create index on agendamentos (lead_id);

-- ---------------------------------------------------------------------------
-- Dados iniciais
-- ---------------------------------------------------------------------------
insert into configuracoes (chave, valor) values
  ('simulador', '{
     "credito_min_centavos": 10000000, "credito_max_centavos": 1000000000,
     "ltv": {"home_equity": 0.60, "financiamento": 0.80},
     "taxas": [0.0119, 0.0129, 0.0139, 0.0149, 0.0159, 0.0169], "taxa_min": 0.0119,
     "prazos": [60, 120, 180, 240], "carencias": [30, 60, 90], "indexador": "IPCA"
   }'),
  ('regioes', '{"ufs": ["MG","SP","MS","MT","PR","SC","RS","RJ","ES"]}'),
  ('agente', '{"ativo_global": false, "max_msgs_antes_humano": 12, "atraso_seg": [4, 12],
               "modelo_conversa": "claude-sonnet-5-5", "modelo_classificacao": "claude-haiku-5-5"}'),
  ('horario', '{"tz": "America/Sao_Paulo", "dias": [1,2,3,4,5], "inicio": "08:30", "fim": "18:00",
                "sabado": {"inicio": "09:00", "fim": "12:00"}}'),
  ('alertas', '{"quente_sem_resposta_min": 15, "parado_documentacao_dias": 3}');

insert into documento_tipos (chave, nome, grupo, obrigatorio, so_se_financiado, ordem) values
  ('rg_cnh', 'RG ou CNH', 'pessoais', true, false, 1),
  ('cpf', 'CPF (se não constar no documento)', 'pessoais', false, false, 2),
  ('estado_civil', 'Certidão de estado civil', 'pessoais', true, false, 3),
  ('residencia', 'Comprovante de residência', 'pessoais', true, false, 4),
  ('renda', 'Comprovantes de renda', 'renda', true, false, 5),
  ('ir', 'Última declaração de IR', 'renda', true, false, 6),
  ('matricula', 'Matrícula atualizada do imóvel', 'imovel', true, false, 7),
  ('iptu', 'IPTU (capa)', 'imovel', true, false, 8),
  ('saldo_devedor', 'Extrato do saldo devedor', 'imovel', true, true, 9),
  ('fotos_imovel', 'Fotos do imóvel', 'imovel', false, false, 10);

-- ---------------------------------------------------------------------------
-- Funções de negócio
-- ---------------------------------------------------------------------------
create or replace function is_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from usuarios where id = auth.uid() and papel = 'gestor' and ativo)
$$;

-- Rodízio de leads do site: o vendedor ativo com menos leads abertos recebe.
create or replace function proximo_vendedor() returns uuid
language sql volatile security definer set search_path = public as $$
  select u.id from usuarios u
  left join leads l on l.usuario_id = u.id and l.etapa not in ('liberado', 'perdido')
  where u.ativo and u.recebe_leads_site
  group by u.id
  order by count(l.id), random()
  limit 1
$$;

-- Toda mudança de etapa gera histórico e conversões a enviar (fila para o job de conversões).
-- security definer: o vendedor (RLS) não tem insert nessas tabelas, o gatilho tem.
-- Quem chama define o ator com: set local app.ator = 'vendedor' | 'gestor' | 'ia' | 'sistema'.
create or replace function on_lead_etapa() returns trigger
language plpgsql security definer set search_path = public as $$
declare ev text;
begin
  if new.etapa is distinct from old.etapa then
    new.etapa_em := now();
    insert into etapa_historico (lead_id, de, para, por, usuario_id, motivo_perda)
      values (new.id, old.etapa, new.etapa,
              coalesce(nullif(current_setting('app.ator', true), ''), 'sistema'),
              auth.uid(), new.motivo_perda);
    ev := case new.etapa
            when 'qualificado'  then 'QualifiedLead'
            when 'documentacao' then 'SubmitApplication'
            when 'proposta'     then 'Proposal'
            when 'liberado'     then 'Purchase'
          end;
    if ev is not null then
      insert into conversoes_enviadas (lead_id, plataforma, evento, event_id, valor_centavos)
      select new.id, p, ev, new.id::text || ':' || ev, new.receita_centavos
      from unnest(array['google_ads', 'meta']) as p
      on conflict (lead_id, plataforma, evento) do nothing;
    end if;
  end if;
  return new;
end $$;
create trigger leads_etapa before update of etapa on leads
  for each row execute function on_lead_etapa();

-- ---------------------------------------------------------------------------
-- RLS (painel). O site público e os jobs usam a service role, que ignora RLS.
-- ---------------------------------------------------------------------------
alter table usuarios            enable row level security;
alter table instancias          enable row level security;
alter table canais              enable row level security;
alter table cliques             enable row level security;
alter table leads               enable row level security;
alter table simulacoes          enable row level security;
alter table conversas           enable row level security;
alter table mensagens           enable row level security;
alter table classificacoes      enable row level security;
alter table etapa_historico     enable row level security;
alter table agente_log          enable row level security;
alter table codigos_acesso      enable row level security;
alter table documento_tipos     enable row level security;
alter table documento_itens     enable row level security;
alter table dados_cadastrais    enable row level security;
alter table audit_log           enable row level security;
alter table conversoes_enviadas enable row level security;
alter table gastos_anuncio      enable row level security;
alter table configuracoes       enable row level security;
alter table depoimentos         enable row level security;
alter table agendamentos        enable row level security;

create or replace function pode_ver_lead(p_lead uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from leads l where l.id = p_lead and (l.usuario_id = auth.uid() or is_gestor()))
$$;

create policy usuarios_ver    on usuarios for select using (id = auth.uid() or is_gestor());
create policy usuarios_gestor on usuarios for all using (is_gestor()) with check (is_gestor());

create policy instancias_ver    on instancias for select using (usuario_id = auth.uid() or is_gestor());
create policy instancias_gestor on instancias for all using (is_gestor()) with check (is_gestor());

create policy leads_ver    on leads for select using (usuario_id = auth.uid() or is_gestor());
create policy leads_editar on leads for update using (usuario_id = auth.uid() or is_gestor())
  with check (usuario_id = auth.uid() or is_gestor());

create policy simulacoes_ver      on simulacoes      for select using (pode_ver_lead(lead_id));
create policy conversas_ver       on conversas       for select using (pode_ver_lead(lead_id));
create policy conversas_editar    on conversas       for update using (pode_ver_lead(lead_id));
create policy mensagens_ver       on mensagens       for select
  using (exists (select 1 from conversas c where c.id = conversa_id and pode_ver_lead(c.lead_id)));
create policy classificacoes_ver  on classificacoes  for select using (pode_ver_lead(lead_id));
create policy etapa_historico_ver on etapa_historico for select using (pode_ver_lead(lead_id));
create policy agente_log_ver      on agente_log      for select
  using (exists (select 1 from conversas c where c.id = conversa_id and pode_ver_lead(c.lead_id)));
create policy documento_itens_ver     on documento_itens  for select using (pode_ver_lead(lead_id));
create policy documento_itens_revisar on documento_itens  for update using (pode_ver_lead(lead_id));
create policy dados_cadastrais_ver    on dados_cadastrais for select using (pode_ver_lead(lead_id));
create policy agendamentos_ver        on agendamentos     for select using (pode_ver_lead(lead_id));
create policy codigos_ver             on codigos_acesso   for select using (pode_ver_lead(lead_id));

create policy canais_ver             on canais              for select using (auth.uid() is not null);
create policy canais_gestor          on canais              for all using (is_gestor()) with check (is_gestor());
create policy cliques_gestor         on cliques             for select using (is_gestor());
create policy audit_gestor           on audit_log           for select using (is_gestor());
create policy conversoes_gestor      on conversoes_enviadas for select using (is_gestor());
create policy gastos_gestor          on gastos_anuncio      for all using (is_gestor()) with check (is_gestor());
create policy config_ver             on configuracoes       for select using (auth.uid() is not null);
create policy config_gestor          on configuracoes       for all using (is_gestor()) with check (is_gestor());
create policy depoimentos_gestor     on depoimentos         for all using (is_gestor()) with check (is_gestor());
create policy documento_tipos_ver    on documento_tipos     for select using (auth.uid() is not null);
create policy documento_tipos_gestor on documento_tipos     for all using (is_gestor()) with check (is_gestor());

-- O hash do código nunca sai para o navegador: grant só das colunas de metadados.
revoke select on codigos_acesso from anon, authenticated;
grant select (id, lead_id, whatsapp_e164, expira_em, tentativas, usado_em, revogado_em, criado_por, created_at)
  on codigos_acesso to authenticated;

-- Storage: buckets privados "documentos" e "midias-whatsapp" (public = false), criados no setup.
-- Leitura só por URL assinada de curta duração gerada no servidor, depois de checar pode_ver_lead()
-- e registrar em audit_log.
