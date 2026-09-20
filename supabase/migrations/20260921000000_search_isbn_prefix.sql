-- "Eu tenho?" e a busca da coleção precisam responder enquanto o usuário
-- ainda está digitando o ISBN, não só quando ele cola o código inteiro.
-- Troca o "=" por um prefixo (like 'digitado%') e prioriza match exato de
-- ISBN no ranking quando ele existir.

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
