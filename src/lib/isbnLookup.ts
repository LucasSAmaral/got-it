/**
 * Pré-preenchimento do formulário de edição nova com a busca por ISBN da BrasilAPI, que consulta a base da
 * Agência Brasileira do ISBN (CBL). Testado em 2026-11-22: achou 38 de 40 edições do catálogo (as duas que
 * faltaram eram um EAN de banca, que não é ISBN, e um importado). O texto é o que a editora declarou ao pedir
 * o ISBN: às vezes em maiúsculas e sem acento, com o número dentro do título. Por isso só preenche; quem
 * cadastra confere. A sinopse fica de fora: a da editora tem direito autoral (ver `SynopsisField`).
 */

/** Os campos da resposta que o app usa (`GET /api/isbn/v1/{isbn}`). */
export type IsbnLookupResult = {
  title?: string | null
  publisher?: string | null
  year?: number | null
}

export type IsbnPrefill = {
  title: string
  publisher: string
  volume: string
  year: string
}

/** A BrasilAPI só aceita ISBN (978/979); EAN de banca (977, 789) daria erro, então nem pergunta. */
export const isLookupableIsbn = (isbn13: string) => /^97[89]\d{10}$/.test(isbn13)

const SMALL_WORDS = new Set(['a', 'as', 'o', 'os', 'e', 'de', 'da', 'das', 'do', 'dos', 'em', 'na', 'nas', 'no', 'nos', 'para', 'com', 'por'])

/** "ABSOLUTE BATMAN 03" vira "Absolute Batman 03"; título com minúsculas fica como veio. */
export function tidyTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, ' ')
  if (trimmed !== trimmed.toLocaleUpperCase('pt-BR')) return trimmed
  return trimmed
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1),
    )
    .join(' ')
}

/**
 * Número no fim do título: "vol. 9", "VOL.04", "N.05", "nº 5", "#12" ou um número solto de até 3 dígitos
 * ("ABSOLUTE BATMAN 03"). Sem zeros à esquerda; vazio quando não acha.
 */
export function volumeFromTitle(title: string): string {
  const match = title.trim().match(/(?:\b(?:vol(?:ume)?|n|nº|n°|no)\.?\s*|#\s*|\s)0*(\d{1,3})$/i)
  return match ? match[1] : ''
}

/**
 * Nome da editora no catálogo: primeiro o de/para (`aliases`, nome inteiro em minúsculas, para razão social);
 * depois, "Panini Comics" vira "Panini" quando a editora conhecida é o começo do nome; senão fica como veio.
 */
export function matchPublisher(
  name: string,
  known: readonly string[],
  aliases: Readonly<Record<string, string>> = {},
): string {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  const lower = trimmed.toLocaleLowerCase('pt-BR')
  const alias = aliases[lower]
  if (alias) return alias
  const found = known.find((each) => {
    const prefix = each.toLocaleLowerCase('pt-BR')
    return lower === prefix || lower.startsWith(`${prefix} `)
  })
  return found ?? trimmed
}

export function prefillFromLookup(
  result: IsbnLookupResult,
  knownPublishers: readonly string[],
  publisherAliases: Readonly<Record<string, string>> = {},
): IsbnPrefill {
  const title = result.title ? tidyTitle(result.title) : ''
  const year = result.year && result.year >= 1900 && result.year <= 2100 ? String(result.year) : ''
  return {
    title,
    publisher: result.publisher ? matchPublisher(result.publisher, knownPublishers, publisherAliases) : '',
    volume: volumeFromTitle(title),
    year,
  }
}

/** Preenche só os campos ainda vazios: o que a pessoa já digitou não é sobrescrito. */
export function fillEmpty<T extends IsbnPrefill>(form: T, prefill: IsbnPrefill): T {
  const keys = Object.keys(prefill) as (keyof IsbnPrefill)[]
  return keys.reduce((acc, key) => (acc[key].trim() === '' && prefill[key] ? { ...acc, [key]: prefill[key] } : acc), form)
}
