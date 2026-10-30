# Tem esse? — banco de dados

Modelo de dados, políticas de acesso (RLS), funções e storage do Supabase. Saiu do `CLAUDE.md` para ele ficar menor. A fonte da verdade é `supabase/migrations/`; isto é o mapa e o porquê. Leia antes de escrever migração ou consulta nova.

## Modelo

Três níveis: **Obra** (a história), **Edição** (a versão física publicada) e **Exemplar** (a cópia do usuário). A fonte da verdade é `supabase/migrations/`. Uma tabela de "conteúdo" que liga edições ao que elas reúnem (edições equivalentes) fica para uma fase posterior; não crie agora.

- `editions.isbn13` é único (quando não nulo). `works` é a série (ver "Séries" em `docs/funcionalidades.md`): título único por `lower(btrim(title))`, não entra na busca. `editions.series_position` (int > 0, opcional) é a posição na série.
- **RLS ligada nas três tabelas.** `works` e `editions`: qualquer usuário autenticado lê e insere com `created_by = auth.uid()`; em `editions`, só o criador atualiza e apenas enquanto `verified = false` — **mais uma política** (`editions_update_admin`, `20260922000000_admin_editions.sql`) libera update irrestrito para o `auth.uid()` do Lucas, fixo em `src/features/admin/admin.ts` (`ADMIN_USER_ID`, mesmo valor nos dois lugares). Políticas permissivas do Postgres se somam com OR, então não precisou mexer na política antiga. `copies`: cada usuário lê, insere, atualiza e apaga só as próprias linhas.
- Uma pessoa pode ter mais de um exemplar da mesma edição (é legítimo).

## Lojas

**Lojas** (`20261027000000_store_arrivals.sql`): `stores` (nome, `slug`, `whatsapp`/`instagram` opcionais; a Lazarus vem na migração) e `store_arrivals` (loja, edição, `arrived_on`, `price` opcional; único por loja + edição + dia). Leitura pública, **inclusive `anon`** (sem login); escrita só do admin (mesmo UUID). Sem login, `editions` e `works` mostram só o que chegou em alguma loja (`editions_select_in_store`, `works_select_in_store`). No Supabase o `anon` tem privilégio de tabela por padrão: o que protege `copies` é a RLS sem política para `anon`, não o grant.

## Apagar conta

**Apagar conta** (`20261029000000_delete_account.sql`): `delete_my_account()` (security definer, só `authenticated`) apaga de `auth.users` a linha de quem chama. Exemplares vão junto (`on delete cascade`); edições, séries e chegadas ficam no catálogo sem autor (`on delete set null`), e edição sem autor só o admin edita. Antes dessa migração as chaves eram NO ACTION e nem o painel conseguia apagar um usuário com dados.

## Busca

`search_my_collection(q text)`: busca nos exemplares do usuário por prefixo de ISBN ou `word_similarity > 0.25` (pg_trgm) em título e editora, ISBN exato primeiro. Compara com `>` explícito porque o role do pooler do Supabase não pode alterar `pg_trgm.word_similarity_threshold`. `search_editions(q text)` é a mesma lógica sobre o catálogo inteiro (sem join com `copies` nem filtro por usuário), usada só no painel de admin.

## Moderação

**Moderação** (`20261030000000_moderation.sql` e `20261030020000_contributors.sql`): `trusted_users`, `is_trusted()`, `cover_submissions` (com `status`), `cover_contributors()`, `edition_reports`, bucket privado `covers-pending` e o gatilho de `editions.cover_url` (ver "Moderação" em `docs/funcionalidades.md`). Ler e decidir a fila, ler e apagar denúncias e promover/rebaixar em `trusted_users`: só o admin (mesmo UUID). Ninguém insere linha já `approved`/`rejected`, e `published` só quem é de confiança.

## Storage

Storage: bucket público `covers` (leitura pública, envio só de quem é de confiança desde a moderação), limitado a 1 MB e `image/jpeg` pela migração `cover_limits`. Apagar só o admin (`cover_delete_admin`): ao trocar a capa no admin, o app apaga a antiga (`removeCoverImage`) depois de salvar a edição com a nova; se falhar, só avisa no console. Remoção bloqueada pela política não dá erro no Storage (volta lista vazia), por isso o código confere o retorno. Arquivo sobrando se apaga pela API ou pelo painel, nunca com `delete` em `storage.objects` (o Supabase bloqueia e o arquivo físico ficaria).

## Migrações com ordem em relação ao deploy

- Aplique a de limites do bucket (`cover_limits`) só depois de publicar o app que reduz a imagem.
- A de séries (`20261005000000_series.sql`) é o contrário: aplique **antes** de publicar o app que a usa (o detalhe e o admin pedem colunas e funções que só existem depois dela).
