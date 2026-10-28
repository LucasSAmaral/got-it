-- Vitrine de loja (versão 1, só a Lazarus): a loja recebe lançamentos, o admin cadastra cada
-- chegada e a página pública /loja/<slug> mostra o que chegou nos últimos dias. Ver
-- "Vitrine da Lazarus" em docs/planos.md.
--
-- Leitura pública (papel anon também): quem chega pelo link do Instagram ou do WhatsApp não tem
-- conta. Escrita só do admin, mesmo UUID de editions_update_admin e de ADMIN_USER_ID
-- (src/features/admin/admin.ts). Se o teste der certo, um perfil de loja (store_members) substitui
-- o UUID fixo.
--
-- Não há "estoque" nem "esgotado": a chegada sai da página sozinha depois de ~30 dias, por filtro na
-- consulta do app, sem rotina no banco.

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  -- Parte do endereço (/loja/lazarus): minúsculas, números e hífen.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Contatos opcionais; a página mostra o botão do canal que estiver preenchido, então trocar de
  -- canal não exige migração. whatsapp só com dígitos, com DDI (5511...), como o wa.me pede.
  whatsapp text check (whatsapp ~ '^[0-9]{10,15}$'),
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  created_at timestamptz not null default now()
);

create table store_arrivals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores on delete cascade,
  edition_id uuid not null references editions,
  -- Sem default: current_date no Supabase é o dia em UTC, que depois das 21h de Brasília já é amanhã.
  -- O app manda a data do aparelho.
  arrived_on date not null,
  price numeric(10,2) check (price > 0),
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now(),
  -- A mesma edição pode chegar de novo noutro dia (reposição), mas não duas vezes no mesmo dia:
  -- evita duplicar com toque repetido no botão de salvar.
  unique (store_id, edition_id, arrived_on)
);
-- A página lista as chegadas recentes de uma loja; a unique acima começa por store_id mas não ajuda
-- a ordenar por data.
create index store_arrivals_store_arrived_idx on store_arrivals (store_id, arrived_on desc);
-- Usado pelas políticas de leitura pública de editions e works abaixo.
create index store_arrivals_edition_idx on store_arrivals (edition_id);

-- Row Level Security -------------------------------------------------------

alter table stores enable row level security;
alter table store_arrivals enable row level security;

-- RLS só filtra linhas; o role ainda precisa do privilégio de base na tabela. anon é o papel dos
-- pedidos sem login (só a chave anônima).
grant usage on schema public to anon;
grant select on stores, store_arrivals to anon, authenticated;
grant insert, update, delete on stores, store_arrivals to authenticated;
grant select on editions, works to anon;

create policy "stores_select_public" on stores
  for select
  to anon, authenticated
  using (true);

create policy "stores_write_admin" on stores
  for all
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a')
  with check ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

create policy "store_arrivals_select_public" on store_arrivals
  for select
  to anon, authenticated
  using (true);

create policy "store_arrivals_write_admin" on store_arrivals
  for all
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a')
  with check ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- Sem login, só as edições que chegaram em alguma loja (e a série delas) ficam visíveis — o resto
-- do catálogo continua só para autenticados. Os exemplares (copies) não ganham nada: lá não há
-- política para anon, e a RLS sem política nega tudo (o Supabase dá privilégio de tabela ao anon por
-- padrão, então é a RLS que segura, não o grant).
create policy "editions_select_in_store" on editions
  for select
  to anon
  using (exists (select 1 from store_arrivals a where a.edition_id = editions.id));

create policy "works_select_in_store" on works
  for select
  to anon
  using (exists (
    select 1
    from editions e
    join store_arrivals a on a.edition_id = e.id
    where e.work_id = works.id
  ));

-- A primeira loja. Contatos ficam vazios até o dono dizer por onde prefere receber as reservas.
insert into stores (name, slug) values ('Lazarus', 'lazarus');
