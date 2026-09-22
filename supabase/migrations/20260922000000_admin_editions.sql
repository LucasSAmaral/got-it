-- Área de administração: o Lucas pode editar qualquer edição do catálogo,
-- mesmo não sendo o criador ou já estando verificada. Políticas permissivas
-- do Postgres se somam com OR, então a regra "só o criador enquanto não
-- verificado" (editions_update_own_while_unverified) continua valendo para
-- os demais usuários — esta política só abre uma segunda porta, fixa nesse
-- UUID. Não é segredo: sem uma sessão de fato autenticada como esse usuário,
-- ter o UUID não dá acesso a nada (o auth.uid() vem do JWT verificado pelo
-- Supabase, não de algo que o cliente possa inventar).
create policy "editions_update_admin" on editions
  for update
  to authenticated
  using (auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a')
  with check (auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a');

-- Busca no catálogo inteiro (todas as edições, não só as da coleção do
-- usuário), para a tela de administração achar qualquer edição por ISBN,
-- prefixo de ISBN ou título/editora. Mesma lógica de search_my_collection
-- (20260921000000_search_isbn_prefix.sql), sem o join com copies nem o
-- filtro por usuário. Com o campo de busca vazio, devolve tudo (mais
-- recentes primeiro) — é a listagem de "ver o catálogo existente".
create or replace function search_editions(q text)
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
  created_at timestamptz
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
    e.created_at
  from editions e
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
