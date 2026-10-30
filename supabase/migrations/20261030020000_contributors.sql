-- Colaboradores: histórico de quem enviou capa e quantas foram aprovadas ou recusadas, para o admin
-- promover a "Usuário confiável" (trusted_users) quem só manda capa certa, e ver quem não manda.
--
-- Antes, aprovar ou recusar apagava a linha da fila. Agora a linha fica, com a situação:
--   pending    esperando o admin (arquivo no bucket covers-pending)
--   approved   aprovada (arquivo copiado para covers; o da fila é apagado)
--   rejected   recusada (arquivo da fila apagado)
--   published  publicada direto por uma conta de confiança, sem fila (arquivo em covers). Registrada
--              para o admin ainda ver o que cada confiável posta e rebaixar quem errar.
-- O arquivo continua saindo da fila na decisão: o histórico é só uma linha de texto por capa.

alter table cover_submissions
  add column status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'published')),
  add column reviewed_at timestamptz;

comment on column cover_submissions.path is
  'Arquivo da capa: no bucket covers-pending (pending, approved, rejected; o arquivo some depois da decisão) ou em covers (published).';

-- A fila do admin lê só as pendentes.
create index cover_submissions_pending_idx on cover_submissions (created_at) where status = 'pending';
create index cover_submissions_submitted_by_idx on cover_submissions (submitted_by);

-- Inserir: pendente (como antes) ou, para quem é de confiança, o registro de uma capa publicada direto.
-- Ninguém insere já aprovada ou recusada: a contagem do colaborador não se forja.
drop policy "cover_submissions_insert_own" on cover_submissions;

create policy "cover_submissions_insert_own" on cover_submissions
  for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and exists (select 1 from editions e where e.id = edition_id and e.created_by = (select auth.uid()))
    and (
      (status = 'pending' and path like (select auth.uid())::text || '/%')
      or (status = 'published' and (select public.is_trusted()))
    )
  );

-- Aprovar e recusar viram update da situação, só do admin.
grant update on cover_submissions to authenticated;

create policy "cover_submissions_update_admin" on cover_submissions
  for update
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a')
  with check ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- O admin promove e rebaixa pelo app (antes, só pelo SQL Editor).
grant insert, delete on trusted_users to authenticated;

create policy "trusted_users_select_admin" on trusted_users
  for select
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

create policy "trusted_users_insert_admin" on trusted_users
  for insert
  to authenticated
  with check ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

create policy "trusted_users_delete_admin" on trusted_users
  for delete
  to authenticated
  using ((select auth.uid()) = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- Quem já enviou capa (ou é de confiança), com e-mail e contagem por situação. Só o admin: para os
-- outros devolve vazio. security definer porque o role authenticated não lê auth.users (o e-mail); por
-- isso o filtro do admin está aqui dentro, e não numa política. O próprio admin fica de fora.
create function public.cover_contributors()
returns table (
  user_id uuid,
  email text,
  approved int,
  rejected int,
  pending int,
  published int,
  trusted boolean,
  last_submission timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    count(*) filter (where s.status = 'approved')::int,
    count(*) filter (where s.status = 'rejected')::int,
    count(*) filter (where s.status = 'pending')::int,
    count(*) filter (where s.status = 'published')::int,
    exists (select 1 from public.trusted_users t where t.user_id = u.id),
    max(s.created_at)
  from auth.users u
  left join public.cover_submissions s on s.submitted_by = u.id
  where auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a'::uuid
    and u.id <> '1df84c70-a8b3-43b9-a528-cf50cac4946a'::uuid
    and (s.id is not null or exists (select 1 from public.trusted_users t where t.user_id = u.id))
  group by u.id, u.email
  order by max(s.created_at) desc nulls last, u.email;
$$;

revoke execute on function public.cover_contributors() from public, anon;
grant execute on function public.cover_contributors() to authenticated;
