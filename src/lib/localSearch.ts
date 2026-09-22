import type { CollectionItem } from '../types/catalog'

/**
 * Busca na cópia local da coleção (modo offline). Reproduz a função `search_my_collection`
 * do banco: prefixo de ISBN, ou `word_similarity` do pg_trgm acima de 0,25 em título e editora,
 * com o ISBN exato primeiro e o resto por similaridade. Como no servidor, acentos contam como
 * letras diferentes ("acao" não acha "Ação").
 */

const SIMILARITY_THRESHOLD = 0.25

const WORD_PATTERN = /[\p{L}\p{N}]+/gu

/** Trigramas de uma palavra já demarcada (2 espaços antes, 1 depois), na ordem em que aparecem. */
function wordTrigrams(word: string): string[] {
  const chars = Array.from(`  ${word} `)
  return chars.slice(0, -2).map((_, i) => chars.slice(i, i + 3).join(''))
}

/** Trigramas na ordem do texto, como o pg_trgm: cada palavra ganha 2 espaços antes e 1 depois. */
function trigramSequence(text: string): string[] {
  return Array.from(text.toLowerCase().matchAll(WORD_PATTERN)).flatMap(([word]) => wordTrigrams(word))
}

/**
 * Maior similaridade entre `queryTrigrams` e um trecho de `remaining` que começa no início da lista.
 * `extent` (os trigramas distintos já vistos) é mutado localmente por conveniência: criar uma cópia
 * a cada passo trocaria O(n) por O(n²) só nesta função, sem ganho de legibilidade.
 */
function bestSimilarityFromStart(remaining: string[], queryTrigrams: Set<string>): number {
  const extent = new Set<string>()
  return remaining.reduce(
    ({ common, best }, trigram) => {
      if (extent.has(trigram)) return { common, best: Math.max(best, common / (queryTrigrams.size + extent.size - common)) }
      extent.add(trigram)
      const nextCommon = common + (queryTrigrams.has(trigram) ? 1 : 0)
      return { common: nextCommon, best: Math.max(best, nextCommon / (queryTrigrams.size + extent.size - nextCommon)) }
    },
    { common: 0, best: 0 },
  ).best
}

/**
 * Equivalente ao `word_similarity(query, text)` do pg_trgm: a maior similaridade entre os trigramas
 * de `query` e qualquer trecho contínuo dos trigramas de `text`.
 */
export function wordSimilarity(query: string, text: string): number {
  const queryTrigrams = new Set(trigramSequence(query))
  const textTrigrams = trigramSequence(text)
  if (queryTrigrams.size === 0 || textTrigrams.length === 0) return 0

  const best = textTrigrams.reduce(
    (max, _, start) => Math.max(max, bestSimilarityFromStart(textTrigrams.slice(start), queryTrigrams)),
    0,
  )
  // O Postgres compara em float4.
  return Math.fround(best)
}

export function searchLocal(items: CollectionItem[], term: string): CollectionItem[] {
  const query = term.trim()
  if (!query) return items

  const digits = query.replace(/[^0-9]/g, '')

  return items
    .map((item) => {
      const isbn = item.isbn13 ?? ''
      return {
        item,
        isbnPrefix: digits !== '' && isbn.startsWith(digits),
        isbnExact: digits !== '' && isbn === digits,
        similarity: Math.max(wordSimilarity(query, item.title), wordSimilarity(query, item.publisher ?? '')),
      }
    })
    .filter((row) => row.isbnPrefix || row.similarity > SIMILARITY_THRESHOLD)
    .sort((a, b) => Number(b.isbnExact) - Number(a.isbnExact) || b.similarity - a.similarity)
    .map((row) => row.item)
}
