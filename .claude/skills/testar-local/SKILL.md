---
name: testar-local
description: Ambiente de teste local do Tem esse? — Postgres com todas as migrações e stubs do Supabase, PostgREST, app servido e Playwright com sessão falsa. Use para validar migração, RLS, consulta/embed/RPC, tirar print de tela (logada, sem conta ou offline) ou testar fluxo no navegador sem tocar no Supabase de produção.
---

# Testar local

Tudo roda em containers e processos temporários; nada vai para o `package.json`. O Supabase de produção nunca é chamado: `lib.mjs` intercepta o host inteiro (`/rest/v1` vai para o PostgREST local, `/auth/v1` responde com a sessão falsa, `/storage/v1` dá 404, o resto é abortado).

Scripts nesta pasta (`.claude/skills/testar-local/`; rode pelo caminho completo):

| Script | O que faz |
| --- | --- |
| `up.sh [--sem-seed]` | Recria do zero: rede docker, `postgres:16` com `stubs.sql`, todas as `supabase/migrations/*.sql` em ordem e `seed.sql`; sobe o `postgrest/postgrest`. Para na primeira migração que falhar e mostra o erro. |
| `app.sh [--sem-build]` | `npm run build` e `vite preview` em segundo plano na porta 4179. Mudou código? Rode de novo. Preview, e não outro `vite dev`, para não derrubar o dev server do Lucas. |
| `pw.sh script.mjs` | Roda um script Node com o Playwright 1.63.0 do cache do `npx` (casa com o Chromium em `~/.cache/ms-playwright`). |
| `screenshot.mjs` | Print de uma tela; também é o modelo para scripts de teste. |
| `down.sh` | Derruba containers, rede e o preview. **Rode sempre no fim.** |

Portas: Postgres `127.0.0.1:54329` (postgres/postgres), PostgREST `:54330`, app `:4179` (`env.sh`).

## Usuários do seed

- `leitor` (`00000000-0000-4000-8000-000000000001`): 2 exemplares (Homem-Aranha 2099 nº 1, lido; Sandman, não lido).
- `admin` (`ADMIN_USER_ID` de `src/features/admin/admin.ts`, que as políticas comparam): sem exemplares.
- Catálogo: série Homem-Aranha 2099 (nºs 1 e 2), Sandman, e a chegada do nº 2 na Lazarus hoje.

Precisa de mais dados para um teste? Insira no próprio script de teste (`psql.sh` abaixo), não aumente o seed sem necessidade.

## Uso típico

```bash
SK=.claude/skills/testar-local
$SK/up.sh && $SK/app.sh
$SK/pw.sh $SK/screenshot.mjs /colecao --esperar "Sandman" --saida <scratchpad>/colecao.png
$SK/pw.sh $SK/screenshot.mjs / --usuario nenhum --largura 1280 --saida <scratchpad>/inicio.png
$SK/pw.sh $SK/screenshot.mjs /colecao --offline --esperar "Sandman" --saida <scratchpad>/offline.png
$SK/down.sh
```

Depois do print, abra a imagem com Read para conferir. Salve prints e scripts no scratchpad, não no repositório.

## SQL direto (RLS, funções, valores do `localSearch.test.ts`)

```bash
docker exec -i got-it-test-db psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 <<'SQL'
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';
select title from search_my_collection('sandman');
reset role;
SQL
```

Como `postgres`, a RLS e o gatilho de capas não se aplicam; para testar política, sempre `set role authenticated` (ou `anon`) com os claims. Para testar uma migração nova antes de aplicar em produção: crie o arquivo em `supabase/migrations/` e rode `up.sh` (ela entra na ordem).

Pelo PostgREST, com o JWT do teste:

```bash
TOKEN=$(node -e "import('$PWD/$SK/lib.mjs').then(m => console.log(m.fakeSession(m.USERS.leitor).access_token))")
curl -s "http://127.0.0.1:54330/copies?select=id,editions(title)" -H "Authorization: Bearer $TOKEN"
```

## Script de teste próprio

Copie `screenshot.mjs` para o scratchpad e importe `lib.mjs` pelo caminho absoluto. O que `lib.mjs` oferece:

- `withBrowser(fn, launchOptions)`: abre o Chromium e fecha no fim.
- `newContext(browser, { user, rest, serviceWorker, ...opçõesDoPlaywright })`: sessão falsa em `localStorage` (`user: USERS.leitor`; sem `user`, visitante sem conta) e as rotas do Supabase. `rest: (route, path) => ...` troca o banco local por mocks (para simular erro, lentidão ou resposta específica). `serviceWorker: true` liga o SW (bloqueado por padrão).
- `goOffline(page)`: carrega online, espera o SW controlar, corta a rede e recarrega, como abrir o PWA sem sinal. Precisa de `serviceWorker: true`.
- `fakeSession(user)`, `signJwt(payload)`, `USERS`, `APP_URL`, `REST_URL`, `SUPABASE_URL` (o de produção, lido do `.env`, só para montar rotas).

## Armadilhas

- **Não há storage local:** upload e capas dão 404 (os cartões mostram as iniciais). Para testar envio de capa, registre no seu script `context.route(`${SUPABASE_URL}/storage/v1/**`, ...)` depois do `newContext`: no Playwright, a rota registrada por último tem prioridade.
- **`innerText` respeita `text-transform`:** textos em maiúsculas por CSS (caixas de narração) precisam de comparação sem diferenciar caixa.
- **Offline:** o console mostra `ERR_INTERNET_DISCONNECTED` (o app tenta o servidor antes de usar a cópia); é esperado. Fontes do Google não carregam offline e o print sai com a fonte reserva.
- **Câmera falsa (scanner):** `withBrowser(fn, { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=<arquivo>.mjpeg'] })`, com um vídeo `.mjpeg` mostrando um EAN-13 desenhado (gerar com `ffmpeg` a partir de uma imagem). O scanner só aceita o código lido 2 vezes seguidas.
- **Mudou `supabase/migrations/`?** Rode `up.sh` de novo (recria tudo). Mudou o app? `app.sh` de novo.
- **Stub que falta:** se uma migração nova usar algo do Supabase que `stubs.sql` não tem (outra função de `auth`, coluna de `storage`), acrescente ao `stubs.sql` imitando o Supabase, não mude a migração.
