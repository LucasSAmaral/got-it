-- Séries: uma série é a história (ex.: "Homem-Aranha 2099"), não a coleção de
-- uma editora; pode juntar publicações diferentes (o "O Início" de 2013 e a
-- capa dura da Panini). Usa a tabela works (Obra), que já existia sem
-- interface: editions.work_id liga a edição à série.

-- Posição da edição na série, quando o volume não serve para ordenar (ex.: o
-- "O Início" é o nº 1 de uma série cuja capa dura começa no vol. 2). Vazio, a
-- ordem vem do volume (calculada no app, src/lib/series.ts).
alter table editions
  add column series_position int check (series_position > 0);

create index editions_work_id_idx on editions (work_id);

-- A série é identificada só pelo nome, sem diferenciar maiúsculas nem espaços
-- nas pontas: "homem-aranha 2099 " e "Homem-Aranha 2099" são a mesma.
alter table works
  add constraint works_title_not_blank check (btrim(title) <> '');
create unique index works_title_key on works (lower(btrim(title)));

-- Devolve o id da série com esse nome, criando se ainda não existir. Fica no
-- banco para ser uma chamada só e não duplicar a série quando duas pessoas
-- criam o mesmo nome ao mesmo tempo (on conflict + nova leitura).
-- security invoker: a RLS de works continua valendo (insere com created_by =
-- auth.uid(), que é o default da coluna).
create or replace function get_or_create_work(p_title text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  clean text := btrim(p_title);
  found uuid;
begin
  select id into found from works where lower(btrim(title)) = lower(clean);
  if found is null then
    insert into works (title) values (clean)
    on conflict (lower(btrim(title))) do nothing
    returning id into found;
  end if;
  if found is null then
    select id into found from works where lower(btrim(title)) = lower(clean);
  end if;
  return found;
end;
$$;

grant execute on function get_or_create_work(text) to authenticated;

-- search_editions passa a devolver a série (para o painel de admin preencher
-- os campos). Mudou o tipo de retorno, então precisa de drop + create.
drop function search_editions(text);

create function search_editions(q text)
returns table (
  id uuid,
  title text,
  publisher text,
  isbn13 text,
  volume text,
  format text,
  year int,
  cover_url text,
  verified boolean,
  created_at timestamptz,
  work_id uuid,
  series_title text,
  series_position int
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.id,
    e.title,
    e.publisher,
    e.isbn13,
    e.volume,
    e.format,
    e.year,
    e.cover_url,
    e.verified,
    e.created_at,
    e.work_id,
    w.title,
    e.series_position
  from editions e
  left join works w on w.id = e.work_id
  where q = ''
    or (
      (
        regexp_replace(q, '[^0-9]', '', 'g') <> ''
        and e.isbn13 like regexp_replace(q, '[^0-9]', '', 'g') || '%'
      )
      or word_similarity(q, e.title) > 0.25
      or word_similarity(q, coalesce(e.publisher, '')) > 0.25
    )
  order by
    case when e.isbn13 = regexp_replace(q, '[^0-9]', '', 'g') then 0 else 1 end,
    greatest(word_similarity(q, e.title), word_similarity(q, coalesce(e.publisher, ''))) desc,
    e.created_at desc;
$$;

grant execute on function search_editions(text) to authenticated;
