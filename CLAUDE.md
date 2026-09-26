# Got it? — contexto do projeto

Este arquivo dá a uma sessão nova do Claude Code o contexto necessário para continuar o projeto. Leia inteiro antes de escrever código. O plano completo também está num documento do Got it? no Claude (não acessível daqui); o que está abaixo é a versão resumida e vigente. O que está em "Estado atual" e "Armadilhas conhecidas" vem de decisões e problemas reais já resolvidos: confira antes de refazer.

## Quem é o dono e como trabalhar com ele

- Lucas, desenvolvedor frontend sênior. Stack de casa: React, TypeScript e Material UI. Está construindo o projeto sozinho, nas horas livres. É a primeira vez dele com Supabase e com ZXing: explique o porquê das decisões nessas áreas.
- Converse em português do Brasil. Interface do app também em português (pt-BR).
- Entregas pequenas e verificáveis: a cada passo, rode `tsc`, testes e build e diga o que passou e o que ficou sem verificar.
- Não faça commit nem push sem ele pedir. Ele costuma dizer "pode commitar"; o push geralmente é ele quem faz.
- Prefira soluções simples. Não adicione dependências, camadas ou abstrações que o escopo atual não exija.
- Nunca mute estado ou props do React no lugar (sempre crie um novo objeto/array). O React decide se re-renderiza, e `React.memo`/`useMemo`/`useCallback` decidem se recalculam, comparando por referência (`===`); mutar quebra essas otimizações. Essa é a única relação real entre imutabilidade e performance do React.
- Fora do que o React observa, prefira o paradigma funcional (funções puras, `map`/`filter`/`reduce` em vez de laço com variável mutada) na lógica pura em `src/lib`, por legibilidade — não porque deixa o React mais rápido, já que é código que roda fora de qualquer render. Não vale a ponto de piorar a complexidade do algoritmo (ex.: `wordSimilarity` em `src/lib/localSearch.ts` roda a cada tecla digitada sobre até 1000 itens; virar totalmente imutável trocaria O(n²) por O(n³), então mantém laço com `Set` mutado localmente) nem contra o próprio modelo do React ou do JS (flag mutável de cancelamento em `useEffect`, classe de erro com `extends Error`). Na dúvida sobre até onde levar, pergunte antes de refatorar o projeto inteiro.
- **`sx` do MUI extenso vira `styled()`.** Quando o `sx` de um componente tem várias props, multi-linha, breakpoint ou seletor aninhado, extraia para um `<Componente>.styles.tsx` ao lado do arquivo que usa (ex.: `AppLayout.tsx` + `AppLayout.styles.tsx`), com `styled(ComponenteMui)(({ theme }) => ({...}))`. `sx` de 1-2 props continua inline — não vale a pena nomear e mover algo tão pequeno. Estilo que depende de estado do componente (ex.: `display` baseado numa variável) também fica inline; forçar isso pro `styled()` exige prop transiente extra pra um ganho pequeno. Estilo repetido em mais de um arquivo (não só dentro do mesmo) vira componente em `src/components/`, não em `.styles.tsx` (ex.: `LoadingSpinner.tsx`, `SearchField.tsx`, `EditionGrid.tsx`); se o componente em si tiver `sx` extenso, ele ganha o próprio `.styles.tsx` ali mesmo (ex.: `EditionCard.styles.tsx`). Um `styled(Box)` que precisa trocar a tag HTML via `component="nav"` (ou `="img"` etc.) exige o generic `<{ component?: ElementType }>` — sem isso o TypeScript recusa a prop. E cuidado: `borderRadius: 3` no `sx` multiplica por `theme.shape.borderRadius` (12 no nosso tema), não por `theme.spacing` — ao mover pro `styled()`, ou usa esse multiplicador ou escreve o valor final em px.
- Ele testa no iPhone real (PWA instalado) e no desktop. Quando algo falha no aparelho, reproduza num navegador antes de mexer (ver "Como verificar") e prove a correção com um teste, em vez de chutar a causa.

## O que é o produto

Got it? é um app para catalogar a coleção de quadrinhos (HQs, encadernados, importados e mangás) e responder, em menos de 3 segundos e mesmo sem sinal, à pergunta "eu já tenho este?" na hora da compra. Nasceu de uma compra repetida.

Duas camadas:

1. **Catálogo de referência** compartilhado: obras e edições, com ISBN/EAN, capa e editora.
2. **Coleção de cada usuário**: exemplares que apontam para uma edição do catálogo. Mais tarde, listas "procuro" e "aceito trocar ou vender".

Formato: PWA em React; apps Android e iOS depois, empacotados com Capacitor (só se o uso real justificar).

## Decisões já tomadas

- **Catálogo colaborativo desde o dia 1.** Dois ISBNs brasileiros válidos (prefixo 978-65), um de banca e um encadernado, não retornam nada em Open Library, Google Books nem Comic Vine. A base própria é a fonte principal: o primeiro usuário que escaneia um código cadastra a edição, e os seguintes recebem tudo preenchido. Bases abertas ficam como extra futuro, principalmente para importados e mangás.
- **ISBN-13 é a chave de busca** de uma edição. Aceitar ISBN-10 na entrada e converter para ISBN-13. Gibi de banca pode trazer só EAN (977 periódico, 789 EAN Brasil); o scanner aceita esses códigos.
- **Backend: Supabase** (Postgres, autenticação, storage), com políticas de acesso por linha (RLS).
- **Busca: Postgres com `pg_trgm`**, tolerante a erros de digitação.
- **Offline só de leitura.** O Lucas decidiu que consultar sem sinal basta; cadastrar exige internet. Não há fila de escrita.
- **Login por e-mail e senha** como caminho principal; o link por e-mail continua como alternativa. No iPhone o PWA instalado tem armazenamento separado do Safari e o link do e-mail abre no Safari, então o link nunca loga o app instalado.
- **Cadastro por foto da capa** (modelo de visão preenche o formulário) e **busca por imagem da capa** (embeddings + `pgvector`) são ideias futuras, não entram agora.

## Stack

- Vite + React 19 + TypeScript (strict) + Material UI 9
- React Router, TanStack Query
- `@supabase/supabase-js`
- `vite-plugin-pwa` (PWA instalável, service worker com `autoUpdate`)
- ZXing (`@zxing/browser` + `@zxing/library`) para ler o código de barras pela câmera. A API nativa `BarcodeDetector` não existe no Safari do iOS.
- Vitest para testes de lógica pura; oxlint
- Gerenciador de pacotes: npm

## Estado atual (Fase 1 concluída, em uso pelo Lucas)

- **Login** (`src/features/auth`): e-mail e senha, com o link por e-mail como alternativa.
- **Coleção** e **"Eu tenho?"** (`src/features/collection`, `src/features/check`): busca por título, editora e ISBN (prefixo). Não busca por autor (a tabela `works` existe, mas não tem interface).
- **Cadastro por ISBN** (`src/features/register`): se a edição existe no catálogo, preenche; se não, formulário manual que cria a edição e o exemplar. Avisa quando o usuário já tem um exemplar da edição, sem impedir. Excluir exemplar existe; editar exemplar ainda não. A editora (cadastro manual e diálogo do admin) é um `Autocomplete` com texto livre (`PublisherField`): sugere as editoras do catálogo, mais usadas primeiro, e depois `COMMON_PUBLISHERS` (`register/constants.ts`); a ordem vem de `rankPublishers` (`src/lib/publishers.ts`).
- **Detalhe do exemplar** (`src/features/copy`, rota `/exemplar/:copyId`): abre ao tocar na capa/título do cartão na coleção e no "Eu tenho?" (prop `to` do `EditionCard`; o botão de ação fica fora do link, porque botão dentro de link não é HTML válido). Capa grande no topo, centralizada na coluna, e abaixo os dados da edição e do exemplar, cada bloco num cartão como o da coleção. O link do cartão não tem o fundo de hover do MUI (só o destaque de foco pelo teclado). Só funciona online: sem conexão avisa na hora, já que capa e detalhes não ficam no aparelho.
- **Painel de admin** (`src/features/admin`): item de menu "Editar catálogo", visível só para o Lucas (`isAdmin`, ver "Modelo de dados"). Busca ou lista qualquer edição do catálogo (`search_editions`, não só a coleção do usuário) e edita título/editora/volume/formato/ano/capa direto pelo app, sem precisar mexer no Supabase. A lista usa os mesmos cartões e a mesma grade da coleção (`EditionCard`, `EditionGrid`), com um lápis no lugar da lixeira.
- **Scanner** (`src/features/scanner`, `src/lib/barcode.ts`): EAN-13 pela câmera traseira; só aceita um código lido 2 vezes seguidas (reflexo do plástico do gibi gera leituras erradas isoladas). Carregado sob demanda para não pesar o bundle inicial.
- **Capas**: reduzidas no navegador antes do envio (`src/lib/image.ts`): lado maior 800 px, JPEG. O bucket `covers` só aceita JPEG de até 1 MB.
- **Offline** (`src/lib/mirrorStore.ts`, `src/lib/localSearch.ts`, `src/auth/AuthProvider.tsx`): ver "Como o modo offline funciona".
- **Layout**: mobile primeiro; a partir de 900 px (`md`) entra barra lateral e a coleção vira grade. Abaixo de 900 px o layout de celular não mudou. A barra lateral (`src/layout/Sidebar.tsx`) e a área de conteúdo (`PageContent.tsx`, largura máxima 1120px) são usadas tanto pelo `AppLayout` (via `Outlet`) quanto pela tela de cadastro, que fica fora do `AppLayout` de propósito — não ganha a navegação inferior do celular. O cadastro segue o mesmo padrão de título (`h2`) e espaçamento das outras páginas; a seta de voltar só aparece abaixo de `md`, porque a partir dali já tem a barra lateral pra navegar. A tela de escanear continua em tela cheia em qualquer tamanho.
- **PWA**: manifest com ícones, service worker, publicado no Netlify.

## Estrutura do código

```
src/
  auth/            AuthProvider (sessão + acesso offline), RequireAuth, useAuth
  components/      componentes compartilhados entre mais de um arquivo: LoadingSpinner, SearchField (pílula com lupa), EditionGrid e EditionCard (capa, título, editora, ISBN e um botão de ação — lixeira na coleção, lápis no admin)
  features/
    admin/         painel de edição do catálogo, só para o Lucas (admin.ts, api.ts)
    auth/          LoginPage
    check/         "Eu tenho?" (CheckPage, useCheck)
    copy/          detalhe do exemplar (CopyDetailPage, api.ts)
    collection/    lista, cartão (EditionCard + excluir), busca com fallback offline (api.ts), OfflineNotice
    register/      cadastro por ISBN, envio da capa e PublisherField (api.ts, constants.ts); o admin reaproveita os três
    scanner/       ScannerDialog, useBarcodeScanner, LazyScannerDialog
  layout/          AppLayout (navegação inferior no celular), Sidebar, PageContent, navItems (os dois primeiros também usados pelo cadastro)
  lib/             isbn, barcode, image, localSearch, mirrorStore, publishers, format (datas, preço, iniciais), supabase (com testes .test.ts ao lado)
  types/catalog.ts
supabase/migrations/   schema, busca, bucket de capas e limites do bucket
netlify.toml           build, Node 22 e redirecionamento do SPA
```

Componente com `sx` extenso tem um `<Componente>.styles.tsx` ao lado (ver regra em "Quem é o dono e como trabalhar com ele").

## Modelo de dados

Três níveis: **Obra** (a história), **Edição** (a versão física publicada) e **Exemplar** (a cópia do usuário). A fonte da verdade é `supabase/migrations/`. Uma tabela de "conteúdo" que liga edições ao que elas reúnem (edições equivalentes) fica para uma fase posterior; não crie agora.

- `editions.isbn13` é único (quando não nulo). `works` existe mas não tem interface nem entra na busca.
- **RLS ligada nas três tabelas.** `works` e `editions`: qualquer usuário autenticado lê e insere com `created_by = auth.uid()`; em `editions`, só o criador atualiza e apenas enquanto `verified = false` — **mais uma política** (`editions_update_admin`, `20260922000000_admin_editions.sql`) libera update irrestrito para o `auth.uid()` do Lucas, fixo em `src/features/admin/admin.ts` (`ADMIN_USER_ID`, mesmo valor nos dois lugares). Políticas permissivas do Postgres se somam com OR, então não precisou mexer na política antiga. `copies`: cada usuário lê, insere, atualiza e apaga só as próprias linhas.
- Uma pessoa pode ter mais de um exemplar da mesma edição (é legítimo).
- `search_my_collection(q text)`: busca nos exemplares do usuário por prefixo de ISBN ou `word_similarity > 0.25` (pg_trgm) em título e editora, ISBN exato primeiro. Compara com `>` explícito porque o role do pooler do Supabase não pode alterar `pg_trgm.word_similarity_threshold`. `search_editions(q text)` é a mesma lógica sobre o catálogo inteiro (sem join com `copies` nem filtro por usuário), usada só no painel de admin.
- Storage: bucket público `covers` (leitura pública, envio só autenticado), limitado a 1 MB e `image/jpeg` pela migração `cover_limits`.
- **As migrações são aplicadas à mão no SQL Editor do Supabase** (não há `supabase/config.toml` nem CLI configurada). Aplique a de limites do bucket só depois de publicar o app que reduz a imagem.

## Configuração fora do repositório

- **Variáveis** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: em `.env` (não versionado; modelo em `.env.example`) e no painel do Netlify. **Não marque como secretas** no Netlify: vão para o bundle por desenho, e o scan de segredos pode reprovar o build (se acontecer, defina `SECRETS_SCAN_OMIT_KEYS` com as duas). Nunca use a chave `service_role` no front.
- **Netlify**: deploy automático do `main` no GitHub (`LucasSAmaral/got-it`).
- **Supabase → Authentication → URL Configuration**: o link por e-mail redireciona para `window.location.origin`, então a URL de produção (`*.netlify.app`) e `https://*.trycloudflare.com/**` (testes no celular) precisam estar em Redirect URLs.
- **Cadastros abertos**: "Allow new users to sign up" continua ligado. Desligar antes de mostrar o app a outras pessoas; contas novas passam a ser criadas em Authentication → Users.

## Como o modo offline funciona

`fetchCollection` (`src/features/collection/api.ts`) tenta o servidor com prazo (busca 2 s, lista 4 s) e, se não houver resposta, usa a cópia do IndexedDB (`mirrorStore`), filtrada por `localSearch`, que reproduz `search_my_collection`. Só a lista completa (sem termo) grava a cópia, e o `AppLayout` a mantém carregada. Sem rede nenhuma (`navigator.onLine === false`) o app decide na hora. A tela avisa que mostra a cópia e quando ela foi salva. `AuthProvider` expõe `offlineAccess` para abrir o app sem sessão válida quando o aparelho já tem cópia; logout ou sessão revogada (`SIGNED_OUT`) apagam a cópia. A cópia só existe depois de abrir o app online uma vez.

Se `search_my_collection` mudar, refaça os valores de `src/lib/localSearch.test.ts`: eles vêm de um Postgres real (ver "Como verificar").

## Como verificar

- `npm run build` (`tsc -b` + Vite), `npm test` (Vitest, só lógica pura), `npm run lint`. O lint tem avisos conhecidos, sempre das duas mesmas categorias: `only-export-components` (`AuthProvider`) e `set-state-in-effect` num `useEffect` que reresponde a uma prop/estado mudando — reseta o formulário do cadastro, o do admin e o preview da capa nos dois. Novo aviso dessas categorias em código parecido não é bug; categoria nova, sim.
- **Postgres local** para validar migrações e a equivalência da busca local: container `postgres:16`, com `auth.users`, `auth.uid()` (lendo `request.jwt.claim.sub`) e o role `authenticated` simulados. Crie um container temporário próprio e remova ao terminar.
- **Testes de navegador (Playwright) não estão no repositório**, porque o projeto não tem essa dependência. Foram feitos com Chromium: Supabase simulado por `page.route` (login, refresh de token, `/rest/v1/*`), `context.setOffline`, câmera falsa com `--use-fake-device-for-media-stream` e vídeo `.mjpeg` com um EAN-13 desenhado. Cubra assim mudanças em auth, offline e scanner. `innerText` respeita `text-transform`, então textos em maiúsculas por CSS precisam de comparação sem diferenciar caixa.
- **Print rápido de uma tela sem instalar nada no projeto**: `npx playwright screenshot ...` roda sem tocar no `package.json`/lockfile (o Chromium já costuma estar em cache da máquina). Pra ver uma tela que exige login, sem servidor de teste nenhum: grave uma sessão falsa em `localStorage` antes do primeiro load (`context.addInitScript`), na chave `sb-<ref-do-projeto>-auth-token` (o `<ref>` é o subdomínio de `VITE_SUPABASE_URL`), com um objeto `{ access_token, token_type, expires_in, expires_at, refresh_token, user }` — o `RequireAuth`/`AuthProvider` aceitam sem validar assinatura. Depois só falta interceptar as chamadas REST relevantes com `page.route`.
- **Testar no celular**: `npm run dev` e, em outro terminal, `npm run tunnel` (precisa do `cloudflared` no PATH; a URL muda a cada execução). Câmera e service worker exigem https. Para testar o PWA de verdade, use o deploy do Netlify: cada URL de túnel é uma origem nova.

## Armadilhas conhecidas

- **ZXing 0.2.1:** `DecodeHintType.TRY_HARDER` quebra o leitor (canvas temporário nunca criado; ele desiste em silêncio no primeiro frame sem código). `stop()` zera o `srcObject` do `<video>` recebido, então cada execução do efeito cria o próprio elemento. O `Dialog` do MUI monta em portal, então a referência do contêiner do vídeo vem por estado (ref em callback).
- **supabase-js sem sessão** manda a chave anônima como token e a RLS devolve lista vazia sem erro. `src/lib/supabase.ts` recusa esses pedidos a `/rest` e `/storage`; sem isso a cópia offline seria sobrescrita por uma lista vazia. Com token vencido e sem rede, `getSession()` pode travar ~30 s (refresh com espera crescente) e depois fica 60 s em cooldown; por isso o prazo cobre a autenticação e o boot tem limite de tempo.
- **postgrest-js repete GET** que falha por rede (1 s, 2 s, 4 s): a lista usa `.retry(false)`.
- **TanStack Query v5** pausa consultas sem rede por padrão: o app usa `networkMode: 'always'` e `onlineManager.setOnline(navigator.onLine)`.
- **"Eu tenho?"**: erro de consulta nunca pode virar "Ainda não tem" (levaria a comprar repetido).
- **Vite:** não suba uma segunda instância no mesmo projeto enquanto o dev server do Lucas estiver aberto. Ela reotimiza `node_modules/.vite` e o servidor em uso passa a devolver 504 (tela em branco). Se acontecer, `npx vite --force`.
- **MUI `Typography`:** as variantes `overline`, `caption` e `button` renderizam `<span>` (as `h*` e `body*` não) — margem vertical é ignorada. Com `styled()`, ponha `display: 'block'` (ex.: `SectionTitle` do detalhe).
- **Datas do Postgres** (`2026-03-05`): não passe por `new Date()` pra exibir — é meia-noite UTC, que em Brasília ainda é o dia anterior. Use `formatDate` (`src/lib/format.ts`).
- **Busca e acentos:** como no servidor, "acao" não acha "Ação" (o pg_trgm não ignora acentos).

## Escopo da Fase 1 (MVP: catálogo pessoal privado)

Concluída, exceto busca por autor. Critério de sucesso: cadastrar 100 gibis da própria estante, a maioria por código de barras, e usar o app em duas compras reais. **É uso, não código: o próximo insumo são os problemas que o Lucas encontrar ao usar.**

Fica fora por enquanto: perfil público, listas de troca e venda, equivalência automática de edições, busca por imagem, pagamento, apps nativos, notificações.

## Em aberto e próximos passos

- Fechar os cadastros no Supabase antes de compartilhar o app.
- Não há botão "Sair" (quando existir, o `SIGNED_OUT` já limpa a cópia offline).
- O admin é um UUID fixo (`ADMIN_USER_ID`), não um papel de verdade — revisitar (tabela/coluna própria) quando houver mais de um editor de confiança no catálogo.
- PostgREST devolve no máximo 1000 linhas por resposta: lista e cópia offline truncam acima disso, e as sugestões de editora contam só as primeiras 1000 edições.
- **Coleção grande** (pedido do Lucas, para depois): (1) `loading="lazy"` nas `<img>` de capa, que hoje baixam todas ao abrir a coleção; (2) paginação só na exibição ("Mostrar mais" ou carregar ao rolar, blocos de 24 ou 30 para fechar a grade de 2 e 3 colunas), com os dados ainda buscados inteiros: a lista completa alimenta a cópia offline, e paginar no servidor faria o "Eu tenho?" offline responder "Ainda não tem" para o que não foi baixado. A busca continua sobre a coleção toda. O limite de 1000 linhas se resolve à parte, buscando em partes de 1000 seguidas.
- Capas não ficam disponíveis offline (o cartão mostra a inicial do título).
- Tablets em pé (600 a 899 px) usam o layout de celular; a tela de escanear continua em tela cheia no desktop.
- Detalhe do exemplar offline: dá para mostrar uma versão parcial a partir da cópia do IndexedDB (sem capa, formato, ano e preço), se fizer falta.
- Considerar `unaccent` na busca (servidor e cópia local juntos).
- **Séries** (ideia do Lucas, ainda não decidida para fazer): listar só os gibis de uma série (Absolute Batman, Invencível…). Usar `works` + `editions.work_id`, que já existem sem interface, em vez de campo de texto novo. Proposta: campo "Série" com sugestões (como o de editora) no cadastro e no admin; nome da série clicável no detalhe abre a lista dela, ordenada por volume numérico; filtro sobre a lista completa, então funciona offline sem mexer na busca. Chips de série na coleção só se fizer falta. A mesma tabela (`works.authors`) serve depois para a busca por autor. Conferir a RLS de `works` e criar índice em `work_id` numa migração.
- O `README.md` ainda é o do template do Vite.
- Perguntar ao Lucas se importados e mangás justificam testar bases abertas (Open Library, Google Books) como fonte extra de preenchimento.
- Fases seguintes do plano: listas "procuro" e "troca ou venda", cadastro por foto da capa, edições equivalentes.

## Material de apoio

Existe um script opcional (`checar-isbn.mjs`) que consulta Open Library e Google Books por uma lista de ISBNs e gera um CSV com acertos e falhas por tipo. Serve para medir cobertura de dados; não faz parte do app.
