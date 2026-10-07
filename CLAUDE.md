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

- **Catálogo colaborativo desde o dia 1.** Dois ISBNs brasileiros válidos (prefixo 978-65), um de banca e um encadernado, não retornam nada em Open Library, Google Books nem Comic Vine. A base própria é a fonte principal: o primeiro usuário que escaneia um código cadastra a edição, e os seguintes recebem tudo preenchido. Bases abertas como fonte extra de preenchimento foram descartadas: o Lucas procurou e não achou nenhuma que trouxesse os dados só pelo código (nem para importados e mangás). Não proponha de novo sem fato novo.
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

- **Login** (`src/features/auth`): e-mail e senha, com o link por e-mail como alternativa. **Sair** (`LogoutDialog`): no pé da barra lateral e, no celular, ícone no título da Coleção (fora da navegação inferior, para evitar toque sem querer). Pede confirmação, porque apaga a cópia offline, e fica desligado sem conexão. O `SIGNED_OUT` também limpa o cache do TanStack Query, para a próxima conta no aparelho não ver a coleção da anterior.
- **Coleção** e **"Eu tenho?"** (`src/features/collection`, `src/features/check`): busca por título, editora e ISBN (prefixo). Não busca por autor (`works.authors` existe, mas não tem interface). Lista grande: os dados vêm inteiros (em partes de 1000, por causa do limite do PostgREST; `fetchAllCopyRows`), mas a tela mostra 30 cartões e vai mostrando mais ao rolar (`useShowMore`, também no admin); capas com `loading="lazy"`. Paginar no servidor faria a cópia offline ficar incompleta e o "Eu tenho?" offline responder "Ainda não tem" para o que não foi baixado.
- **Cadastro por ISBN** (`src/features/register`): se a edição existe no catálogo, preenche; se não, formulário manual que cria a edição e o exemplar. Avisa quando o usuário já tem um exemplar da edição, sem impedir. Excluir exemplar existe (na coleção); editar, no detalhe (ver abaixo). A editora (cadastro manual e diálogo do admin) é um `Autocomplete` com texto livre (`PublisherField`): sugere as editoras do catálogo, mais usadas primeiro, e depois `COMMON_PUBLISHERS` (`register/constants.ts`); a ordem vem de `rankPublishers` (`src/lib/publishers.ts`). O preço pago (cadastro e edição do exemplar) é o `PriceField`: aceita "39,90", "R$ 39,90", "1.234,50" e ponto decimal (`parsePrice` em `src/lib/format.ts`); texto que não é preço mostra aviso e desliga o botão de salvar, em vez de gravar vazio sem avisar.
- **Séries**: uma série é a **história** (ex.: Homem-Aranha 2099), não a coleção de uma editora, e pode juntar publicações diferentes (o "O Início" de 2013 e a capa dura da Panini a partir do vol. 2). Fica em `works` + `editions.work_id`, identificada só pelo nome, sem diferenciar maiúsculas. `SeriesFields` (cadastro manual e admin): "Série" com sugestões, aceitando nome novo, e "Nº na série" opcional (`editions.series_position`), para quando o volume não serve para ordenar; vazio, vale o primeiro número do volume (`seriesPosition` em `src/lib/series.ts`). O nome vira id pela função `get_or_create_work` (acha ou cria, numa chamada só). O detalhe do exemplar mostra "Série · nº", com link para a **página da série** (`src/features/series`, rota `/serie/:workId`): todas as edições do catálogo daquela série, agrupadas pela posição (`groupSeries`) e marcadas "Tenho", "Outra edição" (a posição já está coberta por outra edição sua — ex.: capa dura vol. 1 quando ele tem o "O Início", ambos nº 1) ou "Não tenho"; mostra "Você tem N de M números". Uma consulta só, sem função no banco: `works → editions → copies` embutidos pelo PostgREST, e a RLS de `copies` já deixa só os exemplares de quem pergunta. Os títulos aparecem sem o nome da série no começo (`titleWithinSeries`), senão no celular ficavam todos "Homem-Aranha 20…". Sem sinal, mostra só as edições dele, a partir da lista completa (que traz `work_id`, `series_title` e `series_position`). Uma posição é um número só: edição que reúne nºs 1 e 2 não se encaixa (isso é "edições equivalentes", fase posterior). A série de uma edição já existente só muda pelo admin (RLS de `editions`).
- **Detalhe do exemplar** (`src/features/copy`, rota `/exemplar/:copyId`): abre ao tocar na capa/título do cartão na coleção e no "Eu tenho?" (prop `to` do `EditionCard`; o botão de ação fica fora do link, porque botão dentro de link não é HTML válido). Capa grande no topo, centralizada na coluna, e abaixo os dados da edição e do exemplar, cada bloco num cartão como o da coleção. O link do cartão não tem o fundo de hover do MUI (só o destaque de foco pelo teclado). Só funciona online: sem conexão avisa na hora, já que capa e detalhes não ficam no aparelho. O lápis do cartão "Seu exemplar" abre `EditCopyDialog` (condição, data e preço, os mesmos campos do cadastro, via `copyColumns` e `CONDITIONS`); o diálogo só é montado enquanto está aberto, então o formulário nasce dos dados atuais sem efeito de reset. Salvar invalida o detalhe e a lista (que atualiza a cópia offline).
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
    auth/          LoginPage, LogoutDialog
    check/         "Eu tenho?" (CheckPage, useCheck)
    copy/          detalhe e edição do exemplar (CopyDetailPage, EditCopyDialog, api.ts)
    collection/    lista, cartão (EditionCard + excluir), busca com fallback offline (api.ts), OfflineNotice
    register/      cadastro por ISBN, envio da capa, PublisherField, PriceField e SeriesFields (api.ts, constants.ts); o admin e a edição do exemplar reaproveitam partes
    scanner/       ScannerDialog, useBarcodeScanner, LazyScannerDialog
    series/        página da série (SeriesPage, api.ts)
  hooks/           useShowMore (exibir lista longa em blocos de 30 ao rolar)
  layout/          AppLayout (navegação inferior no celular), Sidebar, PageContent, navItems (os dois primeiros também usados pelo cadastro)
  lib/             isbn, barcode, image, localSearch, mirrorStore, publishers, series, format (datas, preço — exibir e interpretar —, iniciais), supabase (com testes .test.ts ao lado)
  types/catalog.ts
supabase/migrations/   schema, busca, bucket de capas e limites do bucket
netlify.toml           build, Node 22 e redirecionamento do SPA
```

Componente com `sx` extenso tem um `<Componente>.styles.tsx` ao lado (ver regra em "Quem é o dono e como trabalhar com ele").

## Modelo de dados

Três níveis: **Obra** (a história), **Edição** (a versão física publicada) e **Exemplar** (a cópia do usuário). A fonte da verdade é `supabase/migrations/`. Uma tabela de "conteúdo" que liga edições ao que elas reúnem (edições equivalentes) fica para uma fase posterior; não crie agora.

- `editions.isbn13` é único (quando não nulo). `works` é a série (ver "Séries" em "Estado atual"): título único por `lower(btrim(title))`, não entra na busca. `editions.series_position` (int > 0, opcional) é a posição na série.
- **RLS ligada nas três tabelas.** `works` e `editions`: qualquer usuário autenticado lê e insere com `created_by = auth.uid()`; em `editions`, só o criador atualiza e apenas enquanto `verified = false` — **mais uma política** (`editions_update_admin`, `20260922000000_admin_editions.sql`) libera update irrestrito para o `auth.uid()` do Lucas, fixo em `src/features/admin/admin.ts` (`ADMIN_USER_ID`, mesmo valor nos dois lugares). Políticas permissivas do Postgres se somam com OR, então não precisou mexer na política antiga. `copies`: cada usuário lê, insere, atualiza e apaga só as próprias linhas.
- Uma pessoa pode ter mais de um exemplar da mesma edição (é legítimo).
- `search_my_collection(q text)`: busca nos exemplares do usuário por prefixo de ISBN ou `word_similarity > 0.25` (pg_trgm) em título e editora, ISBN exato primeiro. Compara com `>` explícito porque o role do pooler do Supabase não pode alterar `pg_trgm.word_similarity_threshold`. `search_editions(q text)` é a mesma lógica sobre o catálogo inteiro (sem join com `copies` nem filtro por usuário), usada só no painel de admin.
- Storage: bucket público `covers` (leitura pública, envio só autenticado), limitado a 1 MB e `image/jpeg` pela migração `cover_limits`.
- **As migrações são aplicadas à mão no SQL Editor do Supabase** (não há `supabase/config.toml` nem CLI configurada). Aplique a de limites do bucket só depois de publicar o app que reduz a imagem. A de séries (`20261005000000_series.sql`) é o contrário: aplique **antes** de publicar o app que a usa (o detalhe e o admin pedem colunas e funções que só existem depois dela).

## Configuração fora do repositório

- **Variáveis** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: em `.env` (não versionado; modelo em `.env.example`) e no painel do Netlify. **Não marque como secretas** no Netlify: vão para o bundle por desenho, e o scan de segredos pode reprovar o build (se acontecer, defina `SECRETS_SCAN_OMIT_KEYS` com as duas). Nunca use a chave `service_role` no front.
- **Netlify**: deploy automático do `main` no GitHub (`LucasSAmaral/got-it`).
- **Supabase → Authentication → URL Configuration**: o link por e-mail redireciona para `window.location.origin`, então a URL de produção (`*.netlify.app`) e `https://*.trycloudflare.com/**` (testes no celular) precisam estar em Redirect URLs.
- **Cadastros abertos**: "Allow new users to sign up" continua ligado. Desligar antes de mostrar o app a outras pessoas; contas novas passam a ser criadas em Authentication → Users.

## Como o modo offline funciona

`fetchCollection` (`src/features/collection/api.ts`) tenta o servidor com prazo (busca 2 s, lista 4 s) e, se não houver resposta, usa a cópia do IndexedDB (`mirrorStore`), filtrada por `localSearch`, que reproduz `search_my_collection`. Só a lista completa (sem termo) grava a cópia, e o `AppLayout` a mantém carregada. Sem rede nenhuma (`navigator.onLine === false`) o app decide na hora. A tela avisa que mostra a cópia e quando ela foi salva. `AuthProvider` expõe `offlineAccess` para abrir o app sem sessão válida quando o aparelho já tem cópia; logout ou sessão revogada (`SIGNED_OUT`) apagam a cópia. A cópia só existe depois de abrir o app online uma vez. A lista completa também traz a série de cada exemplar (para a página da série sem sinal); cópias salvas antes disso não têm, até o app abrir online de novo.

Se `search_my_collection` mudar, refaça os valores de `src/lib/localSearch.test.ts`: eles vêm de um Postgres real (ver "Como verificar").

## Como verificar

- `npm run build` (`tsc -b` + Vite), `npm test` (Vitest, só lógica pura), `npm run lint`. O lint tem avisos conhecidos, sempre das duas mesmas categorias: `only-export-components` (`AuthProvider`) e `set-state-in-effect` num `useEffect` que reresponde a uma prop/estado mudando — reseta o formulário do cadastro, o do admin e o preview da capa nos dois. Novo aviso dessas categorias em código parecido não é bug; categoria nova, sim.
- **Postgres local** para validar migrações e a equivalência da busca local: container `postgres:16`, com `auth.users`, `auth.uid()` (lendo `request.jwt.claims` → `sub`, como o PostgREST atual manda, e o antigo `request.jwt.claim.sub`; lendo só o antigo, a RLS esconde tudo sem erro quando o pedido vem pelo PostgREST) e o role `authenticated` simulados. Crie um container temporário próprio e remova ao terminar. Para testar o app inteiro contra esse banco: container `postgrest/postgrest` na mesma rede docker (role `authenticator` com `authenticated` e `anon`, `PGRST_JWT_SECRET` qualquer) e, no Playwright, `page.route` repassando `/rest/v1/*` para ele, com sessão falsa cujo `access_token` é um JWT HS256 assinado com esse segredo (`sub`, `role: authenticated`). Pega erro de nome de coluna, embed e RPC que mock nenhum pegaria.
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
- **MUI `ListItemButton`** tem `flex-grow: 1`: para empurrá-lo com `mt: 'auto'` num flex em coluna, ponha `flexGrow: 0` (senão ele estica e centraliza o texto).
- **MUI `Typography`:** as variantes `overline`, `caption` e `button` renderizam `<span>` (as `h*` e `body*` não) — margem vertical é ignorada. Com `styled()`, ponha `display: 'block'` (ex.: `SectionTitle` do detalhe).
- **Datas do Postgres** (`2026-03-05`): não passe por `new Date()` pra exibir — é meia-noite UTC, que em Brasília ainda é o dia anterior. Use `formatDate` (`src/lib/format.ts`).
- **Busca e acentos:** como no servidor, "acao" não acha "Ação" (o pg_trgm não ignora acentos).

## Escopo da Fase 1 (MVP: catálogo pessoal privado)

Concluída, exceto busca por autor. Critério de sucesso: cadastrar 100 gibis da própria estante, a maioria por código de barras, e usar o app em duas compras reais. **É uso, não código: o próximo insumo são os problemas que o Lucas encontrar ao usar.**

Fica fora por enquanto: perfil público, listas de troca e venda, equivalência automática de edições, busca por imagem, pagamento, apps nativos, notificações.

## Em aberto e próximos passos

- Fechar os cadastros no Supabase antes de compartilhar o app.
- O admin é um UUID fixo (`ADMIN_USER_ID`), não um papel de verdade — revisitar (tabela/coluna própria) quando houver mais de um editor de confiança no catálogo.
- PostgREST devolve no máximo 1000 linhas por resposta. A lista da coleção (e a cópia offline) já busca em partes; ainda truncam em 1000 a lista do admin (`search_editions`), os resultados de busca e as sugestões de editora.
- Capas não ficam disponíveis offline (o cartão mostra a inicial do título).
- Tablets em pé (600 a 899 px) usam o layout de celular; a tela de escanear continua em tela cheia no desktop.
- Detalhe do exemplar offline: dá para mostrar uma versão parcial a partir da cópia do IndexedDB (sem capa, formato, ano e preço), se fizer falta.
- Considerar `unaccent` na busca (servidor e cópia local juntos).
- **Séries, próximos passos** (ideias, não decididas): busca por autor via `works.authors`; no "Eu tenho?", "você não tem esta edição, mas tem outras da série".
- **Listagem de séries** (próxima a fazer): item de menu com **todas** as séries do catálogo (decisão do Lucas), cada uma com "você tem N de M"; tocar abre a página da série que já existe. Filtro "séries que sigo" **derivado** (decisão do Lucas): sigo = tenho pelo menos um exemplar da série; sem tabela nova, funciona offline. Evoluir depois para seguir explícito (tabela `follows` com RLS como a de `copies`, botão na página da série, já marcado nas séries em que tem exemplar), que cobre seguir antes do primeiro número e deixar de seguir. Sem sinal, só as séries dele, a partir da cópia local. Com ela a navegação vai a 4 itens; Catálogo e Início levariam a 6, que não cabem na barra inferior do celular (agrupar ou criar "Mais").
- Séries que ficam sem edição (renomeou ou tirou a série no admin) continuam em `works` e aparecem nas sugestões. Se incomodar: limpar à mão ou sugerir só séries com edição. A listagem de séries deve mostrar só séries com edição.
- **Novo nome do app: "Tem esse?"** (decisão do Lucas, 2026-10-07; troca ainda não feita). "Got it?" não funciona para quem lê quadrinhos em português. O repositório continua `got-it`; muda só o nome do produto. Endereço novo: `temesse.netlify.app` (`gotit`/`got-it` não estavam livres no Netlify). No app escrever sempre "Tem esse?", com espaço e interrogação; `temesse` só no endereço. **"Falta esse"** fica reservado para a parte de completar a coleção: nome da futura tela "o que falta" e selo das edições que a pessoa não tem na página da série (no lugar de "Não tenho"). Na troca: manifest (`name`/`short_name`), `<title>`, tela de login, textos que citam "Got it?" (inclusive a mensagem do WhatsApp da vitrine) e este arquivo. Domínio novo também exige a URL nas Redirect URLs do Supabase e reinstalar o PWA no iPhone (outra origem: sessão e cópia offline recomeçam). Se um dia houver domínio próprio (`.com.br`), decidir antes de reinstalar, para não pagar essa troca duas vezes. Descartados no brainstorm: Got it?, Banca, Estante, Gibiteca (genéricos); outras opções levantadas: Falta Um, Tá no Gibi, Lombada, Formatinho.
- **Rumo do produto** (Lucas, 2026-10-07): além de gerenciar a coleção, o app deve **ajudar a completar a coleção**. A página da série já mostra o "Não tenho"; o próximo passo natural é uma visão "o que falta" juntando os números faltantes das séries que a pessoa segue. Links de compra e a vitrine da loja (abaixo) se encaixam aí.
- **Ideias para quando o app tiver outros usuários** (conversa de 2026-10-07; nenhuma decidida). Dependem de abrir o app, ou seja, antes fechar os cadastros, ter um admin de verdade e resolver os limites de 1000:
  - **Página do catálogo**: todas as edições, com filtro por "novidades" e ordem alfabética. "Novidades" é adicionado ao catálogo recentemente (`created_at`), não lançamento: o banco não tem data de lançamento, só o ano. Precisa paginar no servidor (não tem cópia offline, então pode). Talvez junto com a listagem de séries (abas ou "agrupar por série"). Enquanto só o Lucas usa, o catálogo é quase a coleção dele.
  - **Página inicial com lançamentos** (como no Guia dos Quadrinhos), para saber se saiu número novo de uma série que a pessoa acompanha. Problema de fundo: o catálogo só cresce quando alguém escaneia o que já comprou, então lançamento só aparece depois de alguém comprar. Falta decidir a fonte (cadastro manual pelo admin, ou ler sites das editoras ou do Guia — sem API conhecida, frágil e com questão de termos de uso). Versão possível sem fonte nova: "recém-adicionadas ao catálogo nas suas séries".
  - **Link de associado da Amazon** nos cartões. Livro: `amazon.com.br/dp/<ISBN-10>?tag=...` (978-65 converte para ISBN-10); EAN 977/789 só por link de busca. Os termos do programa proíbem (pelo que se sabe; conferir) comissão das próprias compras, então só rende com outros usuários; o programa também costuma exigir vendas nos primeiros meses e aviso de que o link é de associado. Mostrar só em edições que a pessoa não tem (página da série, futura lista "procuro"): "comprar" em algo que já tem vai contra o propósito do app. Alternativa: campo opcional na edição (ex.: `editions.amazon_url`) preenchido pelo admin com o link gerado pela própria Amazon — cobre gibi sem ISBN-10, ao custo de trabalho manual por edição.
  - **Vitrine da Lazarus** (loja de quadrinhos perto do Lucas, sem site; vendas anotadas em prancheta): "Novidades na Lazarus" no app, como divulgação das chegadas. Tabelas `stores` (nome, WhatsApp) e `store_arrivals` (loja, edição, data); cards com `EditionCard`; na página da série/"o que falta", "chegou na Lazarus em dd/mm". Contato por link `https://wa.me/55<número>?text=<encodeURIComponent(mensagem com título, editora, volume e ISBN, perguntando "ainda tem?")>` — **sem bot** (API do WhatsApp Business exige aprovação da Meta, cobra por conversa e vira suporte). Escrever "chegou em", nunca "em estoque", e tirar da vitrine após ~30 dias: ninguém vai marcar no app que vendeu. Quem cadastra: no começo o Lucas pelo admin; depois alguém da loja pelo scanner, o que exige um papel "loja" de verdade (mesma pendência do `ADMIN_USER_ID`). Cada chegada também alimenta o catálogo. O que o app oferece à loja é informação de demanda (quem segue a série e não tem o número); possível troca: desconto para usuários do Got it? ou quadrinhos como pagamento. **Não fazer sistema de caixa para a loja**: obrigação fiscal (NFC-e, conferir com o contador deles), exige escrita offline e o Lucas viraria o suporte de um sistema crítico. Antes de código, perguntar à loja o que de fato incomoda; se for a prancheta, uma planilha compartilhada testa a adoção.
  - **Pedido de doação** (como no Guia dos Quadrinhos): hoje Netlify e Supabase gratuitos devem custar zero; o pedido ganha motivo quando precisar de plano pago. Pix com **chave aleatória** (não expor CPF/e-mail) ou link de Apoia.se/Catarse/Buy Me a Coffee, sem dependência nova. Página "Sobre / Apoie" discreta (pé da barra lateral); **nunca no "Eu tenho?"**. Se um dia virar app iOS via Capacitor, conferir as regras da Apple para doações.
- Update bloqueado pela RLS não dá erro no PostgREST (afeta 0 linhas): o admin diria "salvo" sem salvar se a política não deixasse. Hoje não acontece com o Lucas; se aparecer, pedir `.select()` no update e conferir que voltou linha.
- O `README.md` ainda é o do template do Vite.
- Fases seguintes do plano: listas "procuro" e "troca ou venda", cadastro por foto da capa, edições equivalentes.

## Material de apoio

Existe um script opcional (`checar-isbn.mjs`) que consulta Open Library e Google Books por uma lista de ISBNs e gera um CSV com acertos e falhas por tipo. Serve para medir cobertura de dados; não faz parte do app.
