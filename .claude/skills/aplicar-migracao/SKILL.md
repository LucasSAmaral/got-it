---
name: aplicar-migracao
description: Roteiro para criar e aplicar uma migração no banco de produção do Tem esse? (Supabase, pelo plugin MCP). Use sempre que for mudar schema, RLS, função, gatilho ou bucket, ou rodar SQL que altere dados no projeto remoto.
---

# Aplicar migração no Supabase

O projeto remoto é `urfmibhdswfdeiiesnar` (o subdomínio de `VITE_SUPABASE_URL`) e é **o banco de produção**: o Lucas e outras pessoas usam o app nele. Migrações vão pelo plugin do Supabase (MCP), autorizado pelo Lucas em 2026-10-16. Não há `supabase/config.toml` nem CLI configurada; não use `supabase db push`/`config push`.

Antes de escrever o SQL, leia `docs/banco.md` (políticas, funções e o porquê de cada uma). A fonte da verdade é `supabase/migrations/`.

## Roteiro

1. **Arquivo primeiro.** Crie `supabase/migrations/<AAAAMMDDhhmmss>_<nome_em_ingles>.sql`, seguindo os nomes que já existem (ex.: `20261030020000_contributors.sql`); a data é a de hoje, com hora depois da última migração do dia. Comente em português o porquê das partes não óbvias, como as migrações anteriores fazem.
2. **Validar localmente, se a migração tem lógica** (RLS, função, gatilho): skill `testar-local` (`up.sh` aplica todas as migrações em ordem, inclusive a nova, e mostra o erro se falhar; teste a política com `set role authenticated` e os claims). Para coluna nova simples, basta o `up.sh` passar.
3. **Inspecionar o estado atual** com `execute_sql`, só leitura: a tabela/função/política existe? Com qual definição? (`pg_policies`, `pg_proc`, `information_schema.columns`, `storage.buckets`). Assim a migração não colide com algo criado à mão no painel.
4. **Decidir a ordem em relação ao deploy:**
   - O app novo usa coluna ou função nova → aplique **antes** de publicar o app (ex.: séries).
   - A migração restringe algo que o app atual ainda faz → aplique **depois** de publicar o app adaptado (ex.: limites do bucket de capas só depois do app que reduz a imagem).
   - Diga ao Lucas qual é o caso.
5. **Confirmar com o Lucas** antes de aplicar: mostre o que muda e a ordem do passo 4. Vale também para qualquer `execute_sql` que altere ou apague dados (`insert`, `update`, `delete`, `drop`). Aprovação de uma migração não vale para a próxima.
6. **Aplicar** com `apply_migration`, usando como `name` o nome do arquivo sem a data e sem `.sql`, e o conteúdo do arquivo como `query`.
7. **Conferir** com `execute_sql` que o objeto foi criado como esperado (mesmas consultas do passo 3). Se mudou RLS ou função de segurança, rode também `get_advisors` (tipo `security`) e compare com o que já era aviso antes.
8. **Atualizar a documentação:** `docs/banco.md` (e `docs/funcionalidades.md` se o comportamento visível mudou). Se a migração tiver ordem especial em relação ao deploy, registre em "Migrações com ordem em relação ao deploy" no `docs/banco.md`.
9. Commit só quando o Lucas pedir.

## Problemas conhecidos

- **"Invalid or expired requestState"** no `apply_migration`: o pedido não chegou ao banco. Confira com `execute_sql` que nada foi aplicado (passo 3) e repita.
- **Plugin pede login de novo:** o Lucas autoriza pelo link do OAuth. Alternativa manual: ele cola o SQL no SQL Editor do painel; depois confira pelo passo 7.
- **SQL Editor e `execute_sql` rodam como `postgres`**: passam por RLS e pelo gatilho `editions_cover_trusted_only`. Funcionar ali não prova que funciona para `authenticated`; para isso, teste local ou pelo app.
- **`pg_trgm.word_similarity_threshold`** não pode ser alterado pelo role do pooler: compare com `>` explícito, como `search_my_collection` faz. Se `search_my_collection` mudar, refaça os valores de `src/lib/localSearch.test.ts` com um Postgres real.
- **Arquivo do Storage** nunca se apaga com `delete` em `storage.objects` (o Supabase bloqueia e o arquivo físico ficaria): use a API ou o painel.
- **`anon` tem privilégio de tabela por padrão** no Supabase: o que protege é a RLS sem política para `anon`, não o grant. Tabela nova precisa de `enable row level security`.
- **Update bloqueado pela RLS não dá erro** (afeta 0 linhas): ao testar política de update, confira as linhas afetadas.
