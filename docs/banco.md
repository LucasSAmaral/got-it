# Tem esse? — banco de dados

Modelo de dados, políticas de acesso (RLS), funções e storage do Supabase. Saiu do `CLAUDE.md` para ele ficar menor. A fonte da verdade é `supabase/migrations/`; isto é o mapa e o porquê. Leia antes de escrever migração ou consulta nova.

## Modelo

Três níveis: **Obra** (a história), **Edição** (a versão física publicada) e **Exemplar** (a cópia do usuário). A fonte da verdade é `supabase/migrations/`. Uma tabela de "conteúdo" que liga edições ao que elas reúnem (edições equivalentes) fica para uma fase posterior; não crie agora.

- `editions.isbn13` é único (quando não nulo). `works` é a série (ver "Séries" em `docs/funcionalidades.md`): título único por `lower(btrim(title))`, não entra na busca. `editions.series_position` (int > 0, opcional) é a posição na série.
- **RLS ligada nas três tabelas.** `works` e `editions`: qualquer usuário autenticado lê e insere com `created_by = auth.uid()`; em `editions`, só o criador atualiza e apenas enquanto `verified = false` — **mais uma política** (`editions_update_admin`, `20260922000000_admin_editions.sql`) libera update irrestrito para o `auth.uid()` do Lucas, fixo em `src/features/admin/admin.ts` (`ADMIN_USER_ID`, mesmo valor nos dois lugares). Políticas permissivas do Postgres se somam com OR, então não precisou mexer na política antiga. `copies`: cada usuário lê, insere, atualiza e apaga só as próprias linhas.
- Uma pessoa pode ter mais de um exemplar da mesma edição (é legítimo).

## Lojas

**Lojas** (`20261027000000_store_arrivals.sql`): `stores` (nome, `slug`, `whatsapp`/`instagram` opcionais; a Lazarus vem na migração) e `store_arrivals` (loja, edição, `arrived_on`, `price` opcional; único por loja + edição + dia). Leitura pública, **inclusive `anon`** (sem login); escrita só do admin (mesmo UUID). Sem login, `editions` e `works` mostram só o que chegou em alguma loja (`editions_select_in_store`, `works_select_in_store`). No Supabase o `anon` tem privilégio de tabela por padrão: o que protege `copies` é a RLS sem política para `anon`, não o grant.

## Lista de desejos

**Lista de desejos** (`20261102000000_wishes.sql`): `wishes` (`user_id`, `edition_id`, `created_at`), única por pessoa e edição (ao contrário de `copies`, a mesma edição duas vezes não faz sentido). RLS como `copies`, só do dono, mas sem política de update: um desejo só entra ou sai. `on delete cascade` para `auth.users` (apagar a conta leva junto) e para `editions`. O gatilho `copies_remove_wish` (função `remove_wish_on_copy`, security invoker) apaga o desejo da mesma edição quando a pessoa insere um exemplar, em qualquer tela. Aplicada antes do app que a usa (o app anterior não toca nela).

## Sinopse

**Sinopse** (`20261102020000_synopsis.sql`): `editions.synopsis` (1 a 1500 caracteres) e `editions.synopsis_source` (`manual` ou `ia`); o check `editions_synopsis_has_source` obriga as duas a andarem juntas (com sinopse sempre há origem; sem, nenhuma). Nome escolhido para não colidir com `editions_synopsis_source_check`, que o Postgres dá sozinho ao check da coluna. Sem política nova: escreve quem já podia mudar a edição (quem criou enquanto não verificada, e o admin). `search_editions` passa a devolver `synopsis` (drop + create, mesma lógica). Hoje só existe `manual`; `ia` fica para a sinopse por IA (ver `docs/planos.md`). Aplicada antes do app que a usa.

## Notas por estrela

**Notas** (`20261102010000_ratings.sql`): `ratings` (`user_id`, `edition_id`, `stars` 1 a 5, `created_at`, `updated_at`), chave primária `(user_id, edition_id)`: uma nota por pessoa e edição, mudar é update. RLS só do dono (ver, inserir, atualizar, apagar); `on delete cascade` para `auth.users` e `editions`. O gatilho `ratings_touch_and_mark_read` (security invoker) carimba `updated_at` e marca como lido o exemplar da mesma edição, se houver. As médias vêm de duas funções **security definer** (a RLS esconde as notas dos outros; elas devolvem só agregado, nunca quem deu qual nota), só para `authenticated`: `edition_rating_stats(p_edition_ids uuid[])` (média com uma casa e contagem por edição pedida; edição sem nota não aparece) e `series_rating_stats()` (todas as séries com nota; média de todas as notas das edições da série juntas, não a média das médias). O Supabase lista as duas em "Signed-In Users Can Execute SECURITY DEFINER Function", como `cover_contributors` e `delete_my_account`: é intencional. Aplicada antes do app que a usa.

## Apagar conta

**Apagar conta** (`20261029000000_delete_account.sql`): `delete_my_account()` (security definer, só `authenticated`) apaga de `auth.users` a linha de quem chama. Exemplares, desejos e notas vão junto (`on delete cascade`); edições, séries e chegadas ficam no catálogo sem autor (`on delete set null`), e edição sem autor só o admin edita. Antes dessa migração as chaves eram NO ACTION e nem o painel conseguia apagar um usuário com dados.

## Busca

`search_my_collection(q text)`: busca nos exemplares do usuário por prefixo de ISBN ou `word_similarity > 0.25` (pg_trgm) em título e editora, ISBN exato primeiro. Compara com `>` explícito porque o role do pooler do Supabase não pode alterar `pg_trgm.word_similarity_threshold`. `search_editions(q text)` é a mesma lógica sobre o catálogo inteiro (sem join com `copies` nem filtro por usuário), usada só no painel de admin (devolve também a série e a sinopse, para o diálogo de edição).

## Moderação

**Moderação** (`20261030000000_moderation.sql` e `20261030020000_contributors.sql`): `trusted_users`, `is_trusted()`, `cover_submissions` (com `status`), `cover_contributors()`, `edition_reports`, bucket privado `covers-pending` e o gatilho de `editions.cover_url` (ver "Moderação" em `docs/funcionalidades.md`). Ler e decidir a fila, ler e apagar denúncias e promover/rebaixar em `trusted_users`: só o admin (mesmo UUID). Ninguém insere linha já `approved`/`rejected`, e `published` só quem é de confiança.

## Storage

Storage: bucket público `covers` (leitura pública, envio só de quem é de confiança desde a moderação), limitado a 1 MB e `image/jpeg` pela migração `cover_limits`. Apagar só o admin (`cover_delete_admin`): ao trocar a capa no admin, o app apaga a antiga (`removeCoverImage`) depois de salvar a edição com a nova; se falhar, só avisa no console. Remoção bloqueada pela política não dá erro no Storage (volta lista vazia), por isso o código confere o retorno. Arquivo sobrando se apaga pela API ou pelo painel, nunca com `delete` em `storage.objects` (o Supabase bloqueia e o arquivo físico ficaria).

## Migrações com ordem em relação ao deploy

- Aplique a de limites do bucket (`cover_limits`) só depois de publicar o app que reduz a imagem.
- A de séries (`20261005000000_series.sql`) é o contrário: aplique **antes** de publicar o app que a usa (o detalhe e o admin pedem colunas e funções que só existem depois dela). O mesmo vale para a de notas (`ratings`) e a de sinopse (`synopsis`): o detalhe pede `synopsis` em toda edição.
