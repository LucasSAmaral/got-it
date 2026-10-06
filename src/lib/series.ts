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
