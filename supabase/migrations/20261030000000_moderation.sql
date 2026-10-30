-- Moderação do catálogo aberto (cadastro aberto desde 2026-10-29).
--
-- Capa: qualquer conta pode cadastrar uma edição, e a capa aparece para todo mundo (cadastro do mesmo
-- ISBN, página da série) e fica pública no bucket `covers`. Agora a capa de quem não é de confiança vai
-- para um bucket privado (`covers-pending`) e só entra na edição quando o admin aprova; até lá, todos
-- veem as iniciais do título. Quem é de confiança (o admin e as contas em `trusted_users`, ex.: um
-- tester que ajuda a encher o catálogo) continua enviando direto para `covers`.
--
-- Texto (título, editora): sem fila, para o próximo que escanear o ISBN continuar recebendo tudo
-- preenchido. Fica a denúncia (`edition_reports`), que o admin resolve pelo app.
--
-- O banco garante a regra, não só o app: sem isso, quem chamasse a API direto pularia a revisão
-- (gravando em `cover_url` um arquivo do bucket ou qualquer URL da internet).
--
-- Mesmo UUID de admin das outras migrações e de ADMIN_USER_ID (src/features/admin/admin.ts).

-- Contas de confiança ---------------------------------------------------------------------------

-- Sem interface: entra e sai pelo SQL Editor (ou MCP), como role postgres.
create table trusted_users (
  user_id uuid primary key references auth.users on delete cascade,
  -- Quem é, para lembrar daqui a meses (ex.: "tester, amigo do Lucas").
  note text,
  created_at timestamptz not null default now()
);

alter table trusted_users enable row level security;
grant select on trusted_users to authenticated;

-- Cada um só vê a própria linha; o app não precisa disso (usa is_trusted()), mas não há por que expor
-- a lista.
create policy "trusted_users_select_own" on trusted_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Quem chama pode publicar capa sem revisão? Usada pelo app (para escolher o bucket), pelo gatilho de
-- editions e pela política do bucket covers.
create function public.is_trusted()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a'::uuid
      or exists (select 1 from public.trusted_users where user_id = auth.uid()),
    false
  );
$$;

revoke execute on function public.is_trusted() from public, anon;
grant execute on function public.is_trusted() to authenticated;

-- editions.cover_url só por quem é de confiança --------------------------------------------------

-- Vale só para pedidos do app (roles anon/authenticated). O SQL Editor roda como postgres, sem
-- auth.uid(), e continua podendo corrigir capas à mão. Apagar a capa (null) é livre: não expõe nada.
create function public.editions_cover_trusted_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and new.cover_url is not null
     and (tg_op = 'INSERT' or new.cover_url is distinct from old.cover_url)
     and not public.is_trusted() then
    raise exception 'A capa entra no catálogo só depois de revisada.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger editions_cover_trusted_only
  before insert or update of cover_url on editions
  for each row execute function public.editions_cover_trusted_only();

-- Fila de capas -----------------------------------------------------------------------------------

-- Uma capa enviada esperando o admin. Aprovar copia o arquivo para `covers`, grava a URL na edição e
-- apaga a linha e o arquivo daqui; recusar só apaga.
create table cover_submissions (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions on delete cascade,
  -- Caminho no bucket covers-pending: <id do usuário>/<isbn>-<data>.jpg
  path text not null unique,
  -- set null: se a conta for apagada, a capa ainda precisa ser revisada (ou recusada).
  submitted_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index cover_submissions_edition_idx on cover_submissions (edition_id);

alter table cover_submissions enable row level security;
grant select, insert, delete on cover_submissions to authenticated;

-- Quem enviou vê a própria (o detalhe do exemplar mostra "capa em análise"); o admin vê todas.
create policy "cover_submissions_select_own_or_admin" on cover_submissions
  for select
  to authenticated
  using (
    submitted_by = (select auth.uid())
    or (select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a'
  );

-- Só para edição que a própria pessoa cadastrou, e só apontando para um arquivo na pasta dela.
create policy "cover_submissions_insert_own" on cover_submissions
  for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and path like (select auth.uid())::text || '/%'
    and exists (select 1 from editions e where e.id = edition_id and e.created_by = (select auth.uid()))
  );

create policy "cover_submissions_delete_admin" on cover_submissions
  for delete
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- Denúncias ---------------------------------------------------------------------------------------

create table edition_reports (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions on delete cascade,
  reason text not null check (reason in ('capa', 'dados', 'outro')),
  details text check (char_length(details) <= 500),
  reported_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now(),
  -- Uma denúncia por pessoa e edição: evita encher a lista com toques repetidos.
  unique (edition_id, reported_by)
);

alter table edition_reports enable row level security;
grant select, insert, delete on edition_reports to authenticated;

create policy "edition_reports_insert_own" on edition_reports
  for insert
  to authenticated
  with check (reported_by = (select auth.uid()));

-- Ler e resolver (apagar), só o admin.
create policy "edition_reports_select_admin" on edition_reports
  for select
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

create policy "edition_reports_delete_admin" on edition_reports
  for delete
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- Storage -----------------------------------------------------------------------------------------

-- Privado: sem URL pública. Mesmos limites do bucket covers (o app reduz a capa antes de enviar).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers-pending', 'covers-pending', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- Cada um envia só para a própria pasta (<id do usuário>/...).
create policy "covers_pending_insert_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'covers-pending'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Ver (para revisar) e apagar (ao aprovar ou recusar), só o admin.
create policy "covers_pending_select_admin" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'covers-pending' and (select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

create policy "covers_pending_delete_admin" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'covers-pending' and (select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- O bucket público passa a aceitar envio só de quem é de confiança (antes: qualquer autenticado).
drop policy "covers_insert_authenticated" on storage.objects;

create policy "covers_insert_trusted" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'covers' and (select public.is_trusted()));
