# Got it? — contexto do projeto

Este arquivo dá a uma sessão nova do Claude Code todo o contexto necessário para continuar o projeto. Leia inteiro antes de escrever código. O plano completo também está num documento do Got it? no Claude (não acessível daqui); as decisões abaixo são a versão resumida e vigente.

## Quem é o dono e como trabalhar com ele

- Lucas, desenvolvedor frontend sênior. Stack de casa: React, TypeScript e Material UI. Está construindo o projeto sozinho, nas horas livres.
- Converse em português do Brasil. Interface do app também em português (pt-BR).
- Entregas pequenas e verificáveis: a cada passo, rode build e testes e diga o que passou.
- Não faça commit, push nem crie repositório remoto sem ele pedir.
- Prefira soluções simples. Não adicione dependências, camadas ou abstrações que o escopo atual não exija.

## O que é o produto

Got it? é um app para catalogar a coleção de quadrinhos (HQs, encadernados, importados e mangás) e responder, em menos de 3 segundos e mesmo sem sinal, à pergunta "eu já tenho este?" na hora da compra. Nasceu de uma compra repetida.

Duas camadas:

1. **Catálogo de referência** compartilhado: obras e edições, com ISBN/EAN, capa e editora.
2. **Coleção de cada usuário**: exemplares que apontam para uma edição do catálogo. Mais tarde, listas "procuro" e "aceito trocar ou vender".

Formato: PWA em React primeiro; apps Android e iOS depois, empacotados com Capacitor (só se o uso real justificar).

## Decisões já tomadas

- **Catálogo colaborativo desde o dia 1.** Testes mostraram que dois ISBNs brasileiros válidos (prefixo 978-65), um de banca e um encadernado, não retornam nada em Open Library, Google Books nem Comic Vine. Portanto a base própria é a fonte principal: o primeiro usuário que escaneia um código cadastra a edição, e os seguintes recebem tudo preenchido. Bases abertas ficam como extra futuro, principalmente para importados e mangás.
- **ISBN-13 é a chave de busca** de uma edição. Aceitar ISBN-10 na entrada e converter para ISBN-13.
- **Backend: Supabase** (Postgres, autenticação, storage), com políticas de acesso por linha (RLS).
- **Busca: Postgres com `pg_trgm`**, tolerante a erros de digitação.
- **Offline: service worker + IndexedDB** para a coleção do usuário (Fase 2).
- **Cadastro por foto da capa** (um modelo de visão lê título, número e editora e preenche o formulário para o usuário confirmar) é ideia futura, não entra agora.
- **Busca por imagem da capa** (embeddings + `pgvector`) fica para bem depois.

## Stack

- Vite + React + TypeScript (strict) + Material UI
- React Router, TanStack Query
- `@supabase/supabase-js`
- `vite-plugin-pwa` (PWA instalável)
- Vitest para testes de lógica pura
- Leitura de código de barras pela câmera com ZXing (`@zxing/browser`), na segunda fatia. A API nativa `BarcodeDetector` não existe no Safari do iOS.
- Gerenciador de pacotes: npm

Crie o projeto com `npm create vite@latest got-it -- --template react-ts` dentro da pasta atual (ou na raiz dela, se já for a pasta `got-it`) e use as versões estáveis mais recentes.

## Modelo de dados (rascunho para a migração)

Três níveis: **Obra** (a história), **Edição** (a versão física publicada) e **Exemplar** (a cópia do usuário). Uma tabela de "conteúdo" que liga edições ao que elas reúnem (para calcular edições equivalentes) fica para uma fase posterior; não crie agora.

```sql
create extension if not exists pg_trgm;

create type work_type as enum ('quadrinho', 'manga', 'graphic_novel');
create type copy_status as enum ('collection', 'for_sale', 'for_trade');

create table works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type work_type not null default 'quadrinho',
  authors text[] not null default '{}',
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);

create table editions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references works,            -- opcional no MVP, sem interface ainda
  title text not null,
  volume text,                              -- numero da edicao ou do volume
  publisher text,
  country text not null default 'BR',
  language text not null default 'pt-BR',
  format text,                              -- banca, encadernado, tankobon...
  isbn13 text check (isbn13 ~ '^[0-9]{13}$'),
  cover_url text,
  year int,
  verified boolean not null default false,
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create unique index editions_isbn13_key on editions (isbn13) where isbn13 is not null;
create index editions_title_trgm on editions using gin (title gin_trgm_ops);
create index editions_publisher_trgm on editions using gin (publisher gin_trgm_ops);

create table copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users,
  edition_id uuid not null references editions,
  condition text,
  price_paid numeric(10,2),
  status copy_status not null default 'collection',
  acquired_at date,
  notes text,
  created_at timestamptz not null default now()
);
create index copies_user_idx on copies (user_id);
```

Regras de acesso (RLS ligada nas três tabelas):

- `works` e `editions`: qualquer usuário autenticado lê; insere só com `created_by = auth.uid()`; atualiza só o criador e apenas enquanto `verified = false`.
- `copies`: cada usuário lê e escreve apenas as linhas com `user_id = auth.uid()`.

Uma pessoa pode ter mais de um exemplar da mesma edição (é legítimo). O app deve avisar quando já existe um, não impedir.

Escrever a migração em `supabase/migrations/`, com uma função `search_my_collection(q text)` que busca por título, editora e ISBN nos exemplares do usuário. Validar a migração num Postgres local antes de entregar (as tabelas `auth.users` e a função `auth.uid()` precisam ser simuladas fora do Supabase).

## Escopo da Fase 1 (MVP: catálogo pessoal privado)

Entra:

- Login por e-mail (Supabase Auth)
- Coleção do usuário com busca por título, editora, autor e ISBN
- Campo "Eu tenho?": digitar um ISBN ou termo e ver, em até 3 segundos, se o usuário já tem
- Cadastro por ISBN: se a edição existe no catálogo, preenche; se não, formulário manual que cria a edição e o exemplar. Aviso de duplicata se o usuário já tiver a edição
- Lógica de ISBN com testes: normalizar (hifens e espaços), validar o dígito verificador, converter ISBN-10 para ISBN-13, classificar o prefixo (978/979 = ISBN, 97865 e 97885 = ISBN Brasil, 977 = periódico, 789/790 = EAN Brasil)

Fica fora por enquanto: perfil público, listas de troca e venda, equivalência automática de edições, busca por imagem, pagamento, apps nativos, notificações.

Critério de sucesso: cadastrar 100 gibis da própria estante, a maioria por código de barras, e usar o app em duas compras reais.

## Ordem sugerida das tarefas

1. Criar o projeto Vite + React + TS + MUI, com React Router, TanStack Query, supabase-js e vite-plugin-pwa.
2. Implementar `src/lib/isbn.ts` com testes em Vitest (primeira coisa a ficar verde).
3. Escrever a migração SQL e validá-la num Postgres local.
4. Cliente Supabase com variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, e um `.env.example`. Nunca commitar chaves.
5. Telas: login, coleção com busca, "Eu tenho?", cadastro por ISBN (com formulário manual).
6. Rodar `tsc`, build e testes; abrir o app no navegador e conferir a tela de login.
7. Só depois: leitura de código de barras pela câmera (ZXing), cache offline e ajustes de PWA.

## Pontos em aberto (perguntar ao Lucas quando chegar a hora)

- Criar o projeto no Supabase e informar URL e chave pública (anon). Não dá para validar a integração real sem isso.
- Nome final do pacote e do repositório no GitHub.
- Se importados e mangás justificam testar bases abertas (Open Library, Google Books) como fonte extra de preenchimento.

## Material de apoio

Existe um script opcional (`checar-isbn.mjs`) que consulta Open Library e Google Books por uma lista de ISBNs e gera um CSV com acertos e falhas por tipo. Serve para medir cobertura de dados; não faz parte do app.
