-- "Lido" no exemplar: cada pessoa marca se já leu o próprio exemplar (detalhe do exemplar), e a coleção
-- mostra "Lido" / "Não lido". É do exemplar, não da edição: a RLS de copies já deixa cada um mexer só nos
-- seus. Começa como não lido, inclusive para os exemplares que já existem.

alter table copies add column read boolean not null default false;

-- A busca da coleção passa a devolver `read`, para o selo aparecer também nos resultados de busca e no
-- "Eu tenho?". Mesma lógica de 20260921000000_search_isbn_prefix.sql, só com a coluna nova; como o tipo
-- de retorno mudou, precisa de drop + create. A busca local (src/lib/localSearch.ts) não muda: ela filtra
-- itens que já trazem `read` da lista completa.
drop function search_my_collection(text);

create function search_my_collection(q text)
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
  acquired_at date,
  read boolean
)
language sql
stable
security invoker
set search_path = public
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
    c.acquired_at,
    c.read
  from copies c
  join editions e on e.id = c.edition_id
  where c.user_id = auth.uid()
    and (
      (
        regexp_replace(q, '[^0-9]', '', 'g') <> ''
        and e.isbn13 like regexp_replace(q, '[^0-9]', '', 'g') || '%'
      )
      -- comparação explícita em vez do operador "<%" para não depender de
      -- alterar pg_trgm.word_similarity_threshold (o role do pooler do
      -- Supabase não tem permissão pra isso).
      or word_similarity(q, e.title) > 0.25
      or word_similarity(q, coalesce(e.publisher, '')) > 0.25
    )
  order by
    case when e.isbn13 = regexp_replace(q, '[^0-9]', '', 'g') then 0 else 1 end,
    greatest(word_similarity(q, e.title), word_similarity(q, coalesce(e.publisher, ''))) desc;
$$;

grant execute on function search_my_collection(text) to authenticated;
