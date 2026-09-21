import type { CollectionItem } from '../types/catalog'

/**
 * Busca na cópia local da coleção (modo offline). Reproduz a função `search_my_collection`
 * do banco: prefixo de ISBN, ou `word_similarity` do pg_trgm acima de 0,25 em título e editora,
 * com o ISBN exato primeiro e o resto por similaridade. Como no servidor, acentos contam como
 * letras diferentes ("acao" não acha "Ação").
 */

const SIMILARITY_THRESHOLD = 0.25

const WORD_PATTERN = /[\p{L}\p{N}]+/gu

/** Trigramas na ordem do texto, como o pg_trgm: cada palavra ganha 2 espaços antes e 1 depois. */
function trigramSequence(text: string): string[] {
  const trigrams: string[] = []
  for (const [word] of text.toLowerCase().matchAll(WORD_PATTERN)) {
    const chars = Array.from(`  ${word} `)
    for (let i = 0; i + 3 <= chars.length; i++) {
      trigrams.push(chars.slice(i, i + 3).join(''))
    }
  }
  return trigrams
}

/**
 * Equivalente ao `word_similarity(query, text)` do pg_trgm: a maior similaridade entre os trigramas
 * de `query` e qualquer trecho contínuo dos trigramas de `text`.
 */
export function wordSimilarity(query: string, text: string): number {
  const queryTrigrams = new Set(trigramSequence(query))
  const textTrigrams = trigramSequence(text)
  if (queryTrigrams.size === 0 || textTrigrams.length === 0) return 0

  let best = 0
  for (let start = 0; start < textTrigrams.length; start++) {
    const extent = new Set<string>()
    let common = 0
    for (let end = start; end < textTrigrams.length; end++) {
      const trigram = textTrigrams[end]!
      if (!extent.has(trigram)) {
        extent.add(trigram)
        if (queryTrigrams.has(trigram)) common++
      }
      const similarity = common / (queryTrigrams.size + extent.size - common)
      if (similarity > best) best = similarity
    }
  }
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
