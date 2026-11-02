---
name: publicar-versao
description: Roteiro para subir o Tem esse? para o main (e, portanto, para produção) com a versão nova — commit, número da versão, tag anotada e push. Use quando o Lucas pedir para "subir", "subir na main", "publicar" ou "lançar versão".
---

# Publicar versão

O Netlify publica **todo push no `main`** em `temesse.com.br`. Por isso todo push que muda o app leva versão nova: `package.json`, commit "Versão X.Y.Z" e tag anotada `vX.Y.Z` (decidido pelo Lucas em 2026-11-02, a partir da `v1.0.0`). O pedido do Lucas para subir já é a autorização para commitar, criar a tag e dar push; nada além disso (nunca `--force`, nunca refazer tag já enviada).

A versão aparece no app, no pé da navegação ("Feito por Lucas Amaral · v1.3.0"), lida do `package.json` no build (`__APP_VERSION__` em `vite.config.ts`), e é link para "Novidades" (`/novidades`), que mostra o `CHANGELOG` de `src/lib/changelog.ts`.

## Qual número

Olhe o que muda para quem usa o app desde a última tag (`git describe --tags --abbrev=0`, depois `git log <tag>..HEAD` e o que ainda não foi commitado):

- **minor** (1.1.0 → 1.2.0): alguma funcionalidade nova (tela, botão que faz algo que não fazia, fluxo novo).
- **patch** (1.1.0 → 1.1.1): só correções e ajustes (alinhamento, texto, bug).
- **major** (1.x → 2.0.0): o usuário precisa fazer algo ou o app muda por inteiro (ex.: troca de domínio, que obriga a reinstalar o PWA). **Pergunte ao Lucas antes**: é questão de critério.
- **sem versão**: só docs, `CLAUDE.md`, skills, testes ou configuração que não muda o app. Pode subir sem versão nova (o Netlify publica de novo, mas o app é o mesmo). Diga isso ao Lucas.

Na dúvida entre minor e patch, prefira minor se o Lucas chamaria aquilo de "novidade" ao contar para um tester.

## Roteiro

1. **Conferir o terreno.** Branch `main` (se não estiver, pare e pergunte), `git status`, `git fetch` e `git status -sb`: se o `origin/main` tem commits que o local não tem, pare e avise (o Lucas pode ter dado push de outro lugar).
2. **Verificar** com `npm run build`, `npm test` e `npm run lint` (avisos conhecidos em "Como verificar" no `CLAUDE.md`). Falhou: pare e conte, não suba.
3. **Commitar o que estiver pendente**, um commit por assunto, mensagem em português no estilo dos commits anteriores (título curto; corpo dizendo o quê e por quê). Migração nova no commit: confirme que já foi aplicada em produção (skill `aplicar-migracao`) se o app novo depende dela.
4. **Escolher o número** (seção acima) e dizer ao Lucas em uma linha qual e por quê, sem esperar resposta (exceto major).
5. **Subir a versão:** `npm version <minor|patch> --no-git-tag-version` (atualiza `package.json` e `package-lock.json`, sem commit nem tag).
6. **Escrever a novidade** no topo de `CHANGELOG` (`src/lib/changelog.ts`), se ainda não estiver lá: `version`, `date` (hoje, `AAAA-MM-DD`) e 1 a 3 frases para quem usa o app (o que dá para fazer agora, onde fica; sem nome de tabela, componente ou commit), no tom das entradas anteriores. Ela aparece em "Novidades" (`/novidades`, link na versão). Patch também ganha entrada ("Correções: ..."). Mostre as frases ao Lucas no relato final. Depois `npm test` (`changelog.test.ts` falha se a versão do `package.json` não estiver no topo) e `npm run build`, para conferir que a versão nova entrou no bundle (`grep -o 'v<versão>' dist/assets/index-*.js`: o link da versão é o único lugar com `v` + número).
7. **Commit da versão** com `package.json`, `package-lock.json` e `src/lib/changelog.ts` (`git add` dos três, nunca `-A` aqui): título `Versão X.Y.Z`, corpo com a lista do que mudou para o usuário desde a tag anterior, e a linha de coautoria.
8. **Tag anotada** no commit da versão: `git tag -a vX.Y.Z -m "Versão X.Y.Z: <resumo de uma linha>"`. Anotada, e não leve: o `--follow-tags` só envia as anotadas.
9. **Push:** `git push origin main --follow-tags`. Recusado (non-fast-forward): pare e avise; não force.
10. **Conferir no ar** (o Netlify leva 1 a 3 minutos): em segundo plano, um laço que baixa `https://temesse.com.br/`, acha o `assets/index-*.js` e procura `vX.Y.Z` (o texto do link da versão; as novidades guardam o número sem o "v", então não dão falso positivo), por até 5 minutos. Não apareceu: avise o Lucas para olhar o painel do Netlify (o build pode ter falhado, ex.: scan de segredos; ver "Configuração fora do repositório" no `CLAUDE.md`).
11. **Relatar:** versão, commits que subiram, se apareceu no ar. Lembre que o PWA instalado atualiza sozinho (`autoUpdate`), mas só depois de reabrir o app.

## Cuidados

- **Antes de commitar, olhe o índice** (`git diff --cached --stat`): um `git mv` ou `git add` anterior fica no índice e entra no próximo commit, mesmo com `git add` só de outros arquivos. Já aconteceu na `v1.0.0` (a renomeação de um arquivo foi junto no commit da versão; refeito antes do push).
- Tag errada ainda não enviada: `git tag -d vX.Y.Z` e refaça. Já enviada: não mexa; corrija com uma versão nova (patch).
- Não suba trabalho pela metade junto: se há mudança pendente que o Lucas ainda está testando ou não aprovou, pergunte se entra.
