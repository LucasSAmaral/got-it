-- Sinopse da edição, para ajudar o indeciso junto com a nota (detalhe do exemplar e da edição).
-- Por enquanto escrita à mão: no cadastro de uma edição nova (opcional) e pelo admin. A origem já fica
-- registrada para a sinopse por IA de depois (ver "Sinopse" em docs/planos.md), que só preencherá edições
-- sem sinopse e marcará 'ia' (a tela mostra "gerada por IA").
-- Quem pode escrever é quem já podia mudar a edição (editions_update_own_while_unverified e
-- editions_update_admin): nenhuma política nova. É texto do catálogo compartilhado, então cai na denúncia
-- de dado errado (edition_reports) como o título.

alter table editions
  -- Limite largo para uma sinopse (algumas frases a poucos parágrafos), curto para não virar depósito de texto.
  add column synopsis text check (char_length(synopsis) between 1 and 1500),
  add column synopsis_source text check (synopsis_source in ('manual', 'ia')),
  -- Sinopse e origem andam juntas: com sinopse sempre se sabe de onde veio, sem sinopse não há origem.
  add constraint editions_synopsis_has_source check ((synopsis is null) = (synopsis_source is null));

-- search_editions (painel de admin) passa a devolver a sinopse, para o diálogo de edição preencher o
-- campo. Mudou o tipo de retorno, então precisa de drop + create; o resto é igual à versão de
-- 20261005000000_series.sql.
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
  series_position int,
  synopsis text
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
    e.series_position,
    e.synopsis
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
