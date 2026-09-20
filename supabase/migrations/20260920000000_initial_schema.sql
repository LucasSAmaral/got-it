-- Esquema inicial: works (obra), editions (edição) e copies (exemplar do usuário).
-- Assume que o schema auth (auth.users, auth.uid()) já existe, como no Supabase.

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create type work_type as enum ('quadrinho', 'manga', 'graphic_novel');
create type copy_status as enum ('collection', 'for_sale', 'for_trade');

create table works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type work_type not null default 'quadrinho',
  authors text[] not null default '{}',
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);

create table editions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references works,            -- opcional no MVP, sem interface ainda
  title text not null,
  volume text,                              -- numero da edicao ou do volume
  publisher text,
  country text not null default 'BR',
  language text not null default 'pt-BR',
  format text,                              -- banca, encadernado, tankobon...
  isbn13 text check (isbn13 ~ '^[0-9]{13}$'),
  cover_url text,
  year int,
  verified boolean not null default false,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create unique index editions_isbn13_key on editions (isbn13) where isbn13 is not null;
create index editions_title_trgm on editions using gin (title gin_trgm_ops);
create index editions_publisher_trgm on editions using gin (publisher gin_trgm_ops);

create table copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users,
  edition_id uuid not null references editions,
  condition text,
  price_paid numeric(10,2),
  status copy_status not null default 'collection',
  acquired_at date,
  notes text,
  created_at timestamptz not null default now()
);
create index copies_user_idx on copies (user_id);

-- Row Level Security -------------------------------------------------------

alter table works enable row level security;
alter table editions enable row level security;
alter table copies enable row level security;

-- RLS só filtra linhas; o role ainda precisa do privilégio de base na tabela.
grant usage on schema public to authenticated;
grant select, insert, update on works to authenticated;
grant select, insert, update on editions to authenticated;
grant select, insert, update, delete on copies to authenticated;

-- works: leitura livre para autenticados; insere/atualiza só o próprio criador.
-- (não existe coluna "verified" em works, então a trava de "só enquanto não
-- verificado" descrita no CLAUDE.md se aplica apenas a editions, que tem a coluna.)
create policy "works_select_authenticated" on works
  for select
  to authenticated
  using (true);

create policy "works_insert_own" on works
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "works_update_own" on works
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- editions: leitura livre para autenticados; insere/atualiza só o criador,
-- e só pode atualizar enquanto verified = false.
create policy "editions_select_authenticated" on editions
  for select
  to authenticated
  using (true);

create policy "editions_insert_own" on editions
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "editions_update_own_while_unverified" on editions
  for update
  to authenticated
  using (created_by = auth.uid() and verified = false)
  with check (created_by = auth.uid());

-- copies: cada usuário só enxerga e mexe nas próprias linhas.
create policy "copies_select_own" on copies
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "copies_insert_own" on copies
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "copies_update_own" on copies
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "copies_delete_own" on copies
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Busca na coleção do usuário ------------------------------------------------

create or replace function search_my_collection(q text)
returns table (
  copy_id uuid,
  edition_id uuid,
  title text,
  publisher text,
  isbn13 text,
  volume text,
  cover_url text,
  status copy_status,
  condition text,
  acquired_at date
)
language sql
stable
security invoker
set search_path = public
-- 0.6 (padrão do pg_trgm) é rígido demais para erro de digitação comum;
-- 0.25 tolera 1-2 letras erradas sem trazer resultados sem relação nenhuma.
set pg_trgm.word_similarity_threshold = 0.25
as $$
  select
    c.id as copy_id,
    e.id as edition_id,
    e.title,
    e.publisher,
    e.isbn13,
    e.volume,
    e.cover_url,
    c.status,
    c.condition,
    c.acquired_at
  from copies c
  join editions e on e.id = c.edition_id
  where c.user_id = auth.uid()
    and (
      e.isbn13 = regexp_replace(q, '[^0-9]', '', 'g')
      or q <% e.title
      or q <% coalesce(e.publisher, '')
    )
  order by greatest(word_similarity(q, e.title), word_similarity(q, coalesce(e.publisher, ''))) desc;
$$;

grant execute on function search_my_collection(text) to authenticated;
