-- Notas por estrela: cada pessoa dá de 1 a 5 estrelas a uma edição, e o app mostra a média de todo mundo
-- (na edição, na página da série e na listagem de séries) para ajudar a decidir se vale começar uma coleção.
-- A nota é da edição, não do exemplar: quem tem dois exemplares leu uma história só, e dá para avaliar algo
-- lido emprestado. A nota individual só o dono vê; os outros recebem só média e contagem (funções abaixo).

create table ratings (
  -- cascade: apagar a conta (delete_my_account) leva as notas junto, como exemplares e desejos.
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  edition_id uuid not null references editions on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Uma nota por pessoa e edição: mudar a nota é update, não outra linha.
  primary key (user_id, edition_id)
);

-- A média por edição filtra por edition_id; a chave primária começa por user_id e não serve para isso.
create index ratings_edition_idx on ratings (edition_id);

alter table ratings enable row level security;

grant select, insert, update, delete on ratings to authenticated;

create policy "ratings_select_own" on ratings
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "ratings_insert_own" on ratings
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "ratings_update_own" on ratings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ratings_delete_own" on ratings
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Avaliar marca como lido o exemplar da mesma edição, se a pessoa tiver (ninguém avalia o que não leu).
-- O contrário não vale: marcar "Lido" não pede nota. No banco, para valer em qualquer tela; security
-- invoker basta porque copies_update_own deixa a pessoa atualizar os próprios exemplares. Também carimba
-- updated_at, para saber quando a nota mudou.
create function ratings_touch_and_mark_read()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  update copies set read = true
    where user_id = new.user_id and edition_id = new.edition_id and read = false;
  return new;
end;
$$;

create trigger ratings_touch_and_mark_read
  before insert or update of stars on ratings
  for each row
  execute function ratings_touch_and_mark_read();

-- Média e contagem por edição, só das edições pedidas (página da série, detalhe). security definer porque
-- a RLS só mostra as notas de quem pergunta; a função devolve só o agregado, nunca quem deu qual nota.
-- Edição sem nenhuma nota não aparece no resultado.
create function public.edition_rating_stats(p_edition_ids uuid[])
returns table (edition_id uuid, average numeric, ratings int)
language sql
stable
security definer
set search_path = ''
as $$
  select r.edition_id, round(avg(r.stars), 1), count(*)::int
  from public.ratings r
  where r.edition_id = any (p_edition_ids)
  group by r.edition_id;
$$;

-- Média e contagem por série: todas as notas de todas as edições dela juntas (não a média das médias, para
-- uma edição com 1 nota não pesar como outra com 30). Todas as séries com alguma nota: a listagem de séries
-- mostra todas, e são poucas. Mesmo motivo do security definer acima.
create function public.series_rating_stats()
returns table (work_id uuid, average numeric, ratings int)
language sql
stable
security definer
set search_path = ''
as $$
  select e.work_id, round(avg(r.stars), 1), count(*)::int
  from public.ratings r
  join public.editions e on e.id = r.edition_id
  where e.work_id is not null
  group by e.work_id;
$$;

-- Só quem entrou: as notas aparecem nas telas logadas (séries, detalhe), não na vitrine pública.
revoke execute on function public.edition_rating_stats(uuid[]) from public, anon;
grant execute on function public.edition_rating_stats(uuid[]) to authenticated;
revoke execute on function public.series_rating_stats() from public, anon;
grant execute on function public.series_rating_stats() to authenticated;
