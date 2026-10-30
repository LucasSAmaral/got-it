# Tem esse? — contexto do projeto

Este arquivo dá a uma sessão nova do Claude Code o contexto necessário para continuar o projeto. Leia inteiro antes de escrever código. O detalhe fica em `docs/` e se lê quando o assunto surgir: `docs/funcionalidades.md` (como cada área funciona hoje), `docs/banco.md` (modelo de dados, RLS, funções, storage) e `docs/planos.md` (planos, ideias e pendências). O plano original também está num documento do projeto no Claude (criado quando o app ainda se chamava Got it?) (não acessível daqui). O que está em `docs/funcionalidades.md` e em "Armadilhas conhecidas" vem de decisões e problemas reais já resolvidos: confira antes de refazer.

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

Tem esse? (antes Got it?; o repositório continua `got-it`) é um app para catalogar a coleção de quadrinhos (HQs, encadernados, importados e mangás) e responder, em menos de 3 segundos e mesmo sem sinal, à pergunta "eu já tenho este?" na hora da compra. Nasceu de uma compra repetida.

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
- **Login por e-mail e senha** como caminho principal; entrar sem senha continua como alternativa. **Tudo que chega por e-mail é código de 6 dígitos, nunca link** (criar conta, esqueci a senha, entrar sem senha): no iPhone o PWA instalado tem armazenamento separado do Safari e o link do e-mail abre no Safari, então link nunca loga o app instalado. Decidido em 2026-10-29, ao abrir o app para outras pessoas.
- **Cadastro por foto da capa** (modelo de visão preenche o formulário) e **busca por imagem da capa** (embeddings + `pgvector`) são ideias futuras, não entram agora.
- **Nome do app: "Tem esse?"**: no app, sempre com espaço e interrogação; `temesse` só no endereço (`temesse.com.br`). O repositório e os nomes internos continuam `got-it` (`package.json`, banco do IndexedDB em `mirrorStore.ts`, design system citado em `theme.ts`). **"Falta esse"** fica reservado para a parte de completar a coleção (ver `docs/planos.md`). Histórico do nome e troca de domínio também lá.

## Stack

- Vite + React 19 + TypeScript (strict) + Material UI 9
- React Router, TanStack Query
- `@supabase/supabase-js`
- `vite-plugin-pwa` (PWA instalável, service worker com `autoUpdate`)
- ZXing (`@zxing/browser` + `@zxing/library`) para ler o código de barras pela câmera. A API nativa `BarcodeDetector` não existe no Safari do iOS.
- Vitest para testes de lógica pura; oxlint
- Gerenciador de pacotes: npm

## Estado atual (Fase 1 concluída, em uso pelo Lucas e aberto a outras pessoas)

Uma linha por área. **Antes de mexer numa área, leia a seção dela em `docs/funcionalidades.md`**: lá estão os nomes de arquivos e funções e o porquê de cada escolha.

- **Login e conta:** e-mail e senha, código de 6 dígitos como alternativa; criar conta e esqueci a senha pelo app, todos com a mesma tela de código e o `?voltar=` (`safeNextPath`). Sair pede confirmação (apaga a cópia offline).
- **Privacidade e apagar conta:** `/privacidade`, aberta sem conta; apagar exige digitar "apagar" e chama `delete_my_account`. Ao mudar o que o app guarda ou com quem compartilha, atualize o texto e a data.
- **Início:** explica o app para quem não entrou e mostra "Chegou nas lojas" (chegadas dos 30 dias de todas as lojas, agrupadas por edição), com `ArrivalStoresDialog` ao tocar.
- **Coleção e "Eu tenho?":** busca por título, editora e prefixo de ISBN, sem autor. Dados vêm inteiros (em partes de 1000) e a tela pagina (`md`+) ou mostra mais ao rolar (celular); paginar no servidor quebraria o offline.
- **Cadastro por ISBN:** edição do catálogo preenche tudo; senão formulário manual que cria edição e exemplar. `PublisherField`, `PriceField` (`parsePrice`) e `SeriesFields` são reaproveitados no admin e na edição do exemplar.
- **Séries:** série é a história (`works`), não a coleção da editora; posição em `editions.series_position` ou o volume. Página da série (`/serie/:workId`) e listagem (`/series`), uma consulta só `works → editions → copies`.
- **Detalhe do exemplar:** `/exemplar/:copyId`, só online; edição do exemplar (`EditCopyDialog`) e switch "Lido" (balão na coleção).
- **Painel de admin:** "Editar catálogo", só para o Lucas (`isAdmin`); edita qualquer edição.
- **Moderação:** capa de quem não é de confiança (`is_trusted()`) vai para a fila `covers-pending`/`cover_submissions`; texto tem denúncia (`edition_reports`). Admin revisa em `/admin/revisao`, inclusive "Colaboradores". O banco garante a regra (gatilho e bucket).
- **Chegou nas lojas e vitrine:** o Lucas registra as chegadas por loja em `/admin/chegadas` (edição nova entra sem exemplar); vitrine pública `/loja/:slug` com "Perguntar se ainda tem" (WhatsApp ou Instagram, `src/lib/reservation.ts`).
- **Scanner:** EAN-13, câmera traseira, aceita só código lido 2 vezes seguidas; carregado sob demanda.
- **Capas:** reduzidas no navegador (800 px, JPEG); bucket aceita JPEG até 1 MB.
- **Offline:** leitura pela cópia do IndexedDB (`mirrorStore`, `localSearch`), ver "Offline" em `docs/funcionalidades.md`.
- **Páginas públicas:** Início, vitrine e privacidade; `PublicLayout` mostra a navegação completa com sessão e só cabeçalho com "Entrar" sem.
- **Navegação:** celular com barra inferior (Início, Coleção, Eu tenho?, "Mais"); tela larga com barra lateral. Quais itens ficam na barra é o `inBottomBar` de `navItems.tsx`.
- **Visual de HQ:** o tema dá contorno de nanquim e sombra dura a cartões, diálogos e botões principais (cartão novo não precisa de borda própria); `NarrationTitle` para títulos de seção, `SpeechBalloon` para selos.
- **Layout:** mobile primeiro; a partir de `md` (900 px) barra lateral e grade. O cadastro fica fora do `AppLayout` de propósito; a tela de escanear é sempre tela cheia.
- **PWA:** manifest, service worker com `autoUpdate`, publicado no Netlify.

## Estrutura do código

```
src/
  auth/            AuthProvider (sessão + acesso offline), RequireAuth, useAuth
  components/      componentes compartilhados entre mais de um arquivo: LoadingSpinner, SearchField (pílula com lupa), EditionGrid e EditionCard (capa, título, editora, ISBN e um botão de ação — lixeira na coleção, lápis no admin), CoverThumb (miniatura da capa ou iniciais), LargeCover (capa grande do detalhe e do diálogo das chegadas) e CardFrame (moldura do cartão, em `EditionCard.styles.tsx`), também usados pelo cartão de série; NarrationTitle (caixa de narração), SpeechBalloon (balão de fala) e MadeBy ("Feito por Lucas Amaral", link para lucasamaral.dev.br)
  features/
    admin/         painel de edição do catálogo, registro das chegadas nas lojas e revisão (capas e denúncias), só para o Lucas (admin.ts, api.ts)
    account/       privacidade e apagar conta (PrivacyPage, DeleteAccountDialog, api.ts)
    auth/          LoginPage, SignUpPage, ResetPasswordPage, VerifyCodeForm (código de 6 dígitos), AuthPage (moldura), LogoutDialog
    check/         "Eu tenho?" (CheckPage, useCheck)
    home/          Início (HomePage)
    copy/          detalhe e edição do exemplar (CopyDetailPage, EditCopyDialog, api.ts)
    moderation/    denúncia (ReportEditionDialog) e a API da fila de capas e das denúncias (api.ts); a tela do admin (ModerationPage, PendingCoverDialog, ReportCard) fica em admin/
    collection/    lista, cartão (EditionCard + excluir), busca com fallback offline (api.ts), OfflineNotice
    register/      cadastro por ISBN, envio da capa, PublisherField, PriceField e SeriesFields (api.ts, constants.ts); o admin e a edição do exemplar reaproveitam partes
    scanner/       ScannerDialog, useBarcodeScanner, LazyScannerDialog
    series/        listagem de séries (SeriesListPage) e página da série (SeriesPage, api.ts)
    store/         lojas e chegadas (api.ts), vitrine de uma loja (StorePage) e o que o Início reusa: ArrivalStoresDialog (capa maior e as lojas de um gibi), ReserveButton, OwnershipChip, useOwnedEditionIds; a tela de registro fica no admin
  hooks/           useShowMore (exibir lista longa em blocos de 30 ao rolar; admin, listagem de séries e a coleção no celular)
  layout/          AppLayout (navegação inferior no celular), MoreMenu, PublicLayout (páginas sem conta), Sidebar, PageContent, navItems (Sidebar e PageContent também usados pelo cadastro)
  lib/             isbn, barcode, arrivals (agrupar chegadas por edição), reservation (mensagem e links de reserva), covers, image, localSearch, mirrorStore, pagination, publishers, series, format (datas, preço — exibir e interpretar —, iniciais), supabase (com testes .test.ts ao lado)
  types/catalog.ts
supabase/migrations/   schema, busca, bucket de capas (limites e exclusão pelo admin)
docs/                  funcionalidades, banco e planos (ver o começo deste arquivo)
netlify.toml           build, Node 22, redirecionamento do netlify.app e do SPA
```

Componente com `sx` extenso tem um `<Componente>.styles.tsx` ao lado (ver regra em "Quem é o dono e como trabalhar com ele").

## Modelo de dados

Três níveis: **Obra** (a história, `works`), **Edição** (a versão física publicada, `editions`, chave de busca `isbn13`) e **Exemplar** (a cópia do usuário, `copies`). RLS ligada em tudo; `copies` só do dono. O admin é o UUID fixo `ADMIN_USER_ID` (`src/features/admin/admin.ts`), repetido nas políticas. Detalhe de políticas, funções (`search_my_collection`, `delete_my_account`, moderação), lojas e storage em `docs/banco.md`; a fonte da verdade é `supabase/migrations/`.

- **Migrações e SQL que altera dados no banco de produção:** sempre pela skill `aplicar-migracao` (`.claude/skills/aplicar-migracao/SKILL.md`): arquivo em `supabase/migrations/`, inspecionar, confirmar com o Lucas, aplicar pelo plugin do Supabase e conferir. Projeto `urfmibhdswfdeiiesnar`; não há CLI nem `config.toml`.

## Configuração fora do repositório

- **Variáveis** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: em `.env` (não versionado; modelo em `.env.example`) e no painel do Netlify. **Não marque como secretas** no Netlify: vão para o bundle por desenho, e o scan de segredos pode reprovar o build (se acontecer, defina `SECRETS_SCAN_OMIT_KEYS` com as duas). Nunca use a chave `service_role` no front.
- **Netlify**: deploy automático do `main` no GitHub (`LucasSAmaral/got-it`), publicado em `temesse.com.br` (domínio próprio desde 2026-10-30, registro.br, DNS no Netlify). O `temesse.netlify.app` redireciona para ele por uma regra no `netlify.toml` (o Netlify não faz isso sozinho).
- **Supabase → Authentication → URL Configuration**: Site URL `https://temesse.com.br`; em Redirect URLs, o domínio novo, o antigo (`https://temesse.netlify.app`, até ninguém mais usar) e `https://*.trycloudflare.com/**` (testes no celular), do tempo do link por e-mail; com código pesam pouco.
- **E-mails do Auth por SMTP próprio** (2026-10-29): Gmail `lucassamaraldev@gmail.com` com senha de app (só no painel do Supabase, Authentication → SMTP), remetente "Tem esse?". O SMTP padrão do Supabase só entrega para membros da organização. Limite do Gmail: ~500 e-mails/dia. Trocar por Resend com domínio próprio é só mudar o painel.
- **Cadastros abertos de propósito** (2026-10-29): "Allow new users to sign up" ligado, com "Confirm email" ligado, senha mínima de 8 e limite de e-mails por hora aumentado (Rate Limits). Comprimento do código (Email OTP Length) em 6, igual ao `OTP_LENGTH`: projetos novos vêm com 8, e com 8 o app corta o código e todo código dá "incorreto ou vencido".

## Como verificar

- `npm run build` (`tsc -b` + Vite), `npm test` (Vitest, só lógica pura), `npm run lint`. O lint tem avisos conhecidos, sempre das duas mesmas categorias: `only-export-components` (`AuthProvider`) e `set-state-in-effect` num `useEffect` que reresponde a uma prop/estado mudando — reseta o formulário do cadastro, o do admin e o preview da capa nos dois. Novo aviso dessas categorias em código parecido não é bug; categoria nova, sim.
- **Banco, RLS, telas e fluxos no navegador:** skill `testar-local` (`.claude/skills/testar-local/`): Postgres com todas as migrações e stubs do Supabase, PostgREST, app servido por `vite preview` e Playwright com sessão falsa, sem dependência no `package.json` e sem tocar no Supabase de produção. Cubra assim mudanças em migração, auth, offline e scanner; pega erro de nome de coluna, embed e RPC que mock nenhum pegaria.
- **Testar no celular**: `npm run dev` e, em outro terminal, `npm run tunnel` (precisa do `cloudflared` no PATH; a URL muda a cada execução). Câmera e service worker exigem https. Para testar o PWA de verdade, use o deploy do Netlify: cada URL de túnel é uma origem nova.

## Armadilhas conhecidas

- **ZXing 0.2.1:** `DecodeHintType.TRY_HARDER` quebra o leitor (canvas temporário nunca criado; ele desiste em silêncio no primeiro frame sem código). `stop()` zera o `srcObject` do `<video>` recebido, então cada execução do efeito cria o próprio elemento. O `Dialog` do MUI monta em portal, então a referência do contêiner do vídeo vem por estado (ref em callback).
- **supabase-js sem sessão** manda a chave anônima como token e a RLS devolve lista vazia sem erro. `src/lib/supabase.ts` recusa esses pedidos a `/rest` e `/storage` (`isAnonymousDataRequest`), menos `stores` e `store_arrivals` (`PUBLIC_DATA_PATH`), que devolvem o mesmo com ou sem login — a vitrine pública embute as edições no pedido das chegadas para não precisar abrir `editions`; sem isso a cópia offline seria sobrescrita por uma lista vazia. Com token vencido e sem rede, `getSession()` pode travar ~30 s (refresh com espera crescente) e depois fica 60 s em cooldown; por isso o prazo cobre a autenticação e o boot tem limite de tempo.
- **postgrest-js repete GET** que falha por rede (1 s, 2 s, 4 s): a lista usa `.retry(false)`.
- **TanStack Query v5** pausa consultas sem rede por padrão: o app usa `networkMode: 'always'` e `onlineManager.setOnline(navigator.onLine)`.
- **"Eu tenho?"**: erro de consulta nunca pode virar "Ainda não tem" (levaria a comprar repetido).
- **Vite:** não suba uma segunda instância no mesmo projeto enquanto o dev server do Lucas estiver aberto. Ela reotimiza `node_modules/.vite` e o servidor em uso passa a devolver 504 (tela em branco). Se acontecer, `npx vite --force`.
- **MUI `ListItemButton`** tem `flex-grow: 1`: para empurrá-lo com `mt: 'auto'` num flex em coluna, ponha `flexGrow: 0` (senão ele estica e centraliza o texto).
- **MUI `Typography`:** as variantes `overline`, `caption` e `button` renderizam `<span>` (as `h*` e `body*` não) — margem vertical é ignorada. Com `styled()`, ponha `display: 'block'` (ex.: `SectionTitle` do detalhe).
- **Datas do Postgres** (`2026-03-05`): não passe por `new Date()` pra exibir — é meia-noite UTC, que em Brasília ainda é o dia anterior. Use `formatDate` (`src/lib/format.ts`).
- **Busca e acentos:** como no servidor, "acao" não acha "Ação" (o pg_trgm não ignora acentos).
- Update bloqueado pela RLS não dá erro no PostgREST (afeta 0 linhas): o admin diria "salvo" sem salvar se a política não deixasse. Hoje não acontece com o Lucas; se aparecer, pedir `.select()` no update e conferir que voltou linha.
- **`localSearch` reproduz `search_my_collection`:** se a função do banco mudar, refaça os valores de `src/lib/localSearch.test.ts` com um Postgres real.

## Escopo e próximos passos

Fase 1 concluída, exceto busca por autor; **o próximo insumo são os problemas que o Lucas encontrar ao usar** e o teste com usuários. Escopo, pendências ("Em aberto"), planos (vitrine da Lazarus, séries, ideias para outros usuários, moderação automática) e o material de apoio ficam em `docs/planos.md`. Leia quando o assunto surgir.
