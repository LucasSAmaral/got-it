/**
 * "Nº na série" digitado: inteiro positivo, ou vazio. Devolve `null` quando vazio ou inválido; use
 * `isSeriesPositionInputValid` para distinguir os dois.
 */
export function parseSeriesPosition(text: string): number | null {
  const trimmed = text.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  // A coluna é `int` no Postgres.
  return value > 0 && value <= 2_147_483_647 ? value : null
}

export function isSeriesPositionInputValid(text: string): boolean {
  return text.trim() === '' || parseSeriesPosition(text) !== null
}

/**
 * Posição da edição na série: o "Nº na série" quando preenchido; senão, o primeiro número do volume
 * ("6" → 6, "Vol. 2" → 2). `null` quando nenhum dos dois diz nada (ex.: volume vazio ou "Especial").
 */
export function seriesPosition(edition: { series_position: number | null; volume: string | null }): number | null {
  if (edition.series_position !== null) return edition.series_position
  const match = edition.volume?.match(/\d+/)
  return match ? Number(match[0]) : null
}

/** Marca de uma edição na página da série. */
export type SeriesStatus = 'owned' | 'other_edition' | 'missing'

export interface SeriesSlot<T> {
  /** `null`: edições sem posição (sem nº na série e sem número no volume), no fim da página. */
  position: number | null
  /** Algum exemplar seu ocupa esta posição. */
  covered: boolean
  items: { edition: T; status: SeriesStatus }[]
}

type GroupableEdition = { series_position: number | null; volume: string | null; title: string; owned: boolean }

/**
 * Agrupa as edições de uma série pela posição, em ordem crescente. Numa posição em que você tem alguma
 * edição, as outras edições dela são "outra edição" (ex.: a capa dura vol. 1 quando você tem o "O Início",
 * ambos nº 1), não "não tenho". Dentro da posição, as suas vêm primeiro.
 */
export function groupSeries<T extends GroupableEdition>(editions: T[]): SeriesSlot<T>[] {
  const positions = [...new Set(editions.map(seriesPosition))].sort(
    (a, b) => (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY),
  )
  return positions.map((position) => {
    const inSlot = editions
      .filter((edition) => seriesPosition(edition) === position)
      .sort((a, b) => Number(b.owned) - Number(a.owned) || a.title.localeCompare(b.title, 'pt-BR'))
    const covered = inSlot.some((edition) => edition.owned)
    return {
      position,
      covered,
      items: inSlot.map((edition) => ({
        edition,
        status: edition.owned ? 'owned' : covered ? 'other_edition' : 'missing',
      })),
    }
  })
}

/** "Você tem N de M números": só conta as posições numeradas. */
export function seriesProgress(slots: SeriesSlot<unknown>[]): { covered: number; total: number } {
  const numbered = slots.filter((slot) => slot.position !== null)
  return { covered: numbered.filter((slot) => slot.covered).length, total: numbered.length }
}

/**
 * Título da edição sem o nome da série no começo, para a página da série (que já mostra o nome no topo):
 * "Homem-Aranha 2099: O Início" → "O Início". No celular o título tem uma linha só, e com o prefixo todas
 * as edições ficavam iguais ("Homem-Aranha 20…"). Sem o prefixo, ou se não sobrar nada, devolve o título inteiro.
 */
export function titleWithinSeries(title: string, seriesTitle: string): string {
  const prefix = seriesTitle.trim()
  if (!prefix || !title.toLocaleLowerCase('pt-BR').startsWith(prefix.toLocaleLowerCase('pt-BR'))) return title
  const rest = title.slice(prefix.length)
  // "Batman" não pode cortar "Batmania": o nome da série precisa terminar numa fronteira de palavra.
  if (/^[\p{L}\p{N}]/u.test(rest)) return title
  const trimmed = rest.replace(/^[\s:\-–—·,.]+/, '')
  return trimmed || title
}
