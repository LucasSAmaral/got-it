/** Até duas iniciais do título, para o lugar da capa quando não há imagem (ex.: "Absolute Batman 6" → "AB"). */
export function titleInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== '—')
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

/**
 * Data do Postgres (`2026-03-05`) no formato brasileiro, sem passar por `Date`: `new Date('2026-03-05')`
 * é meia-noite UTC, que no fuso de Brasília ainda é o dia anterior.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

/**
 * Dia do aparelho no formato do Postgres (`2026-03-05`). `toISOString()` daria o dia em UTC, que depois das
 * 21h de Brasília já é amanhã.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Data e hora do Postgres (`timestamptz`, ex.: `2026-10-30T02:41:36+00:00`) como o dia no fuso do aparelho,
 * no formato brasileiro. Diferente de `formatDate`: cortar o texto daria o dia em UTC, que depois das 21h
 * de Brasília já é amanhã.
 */
export function formatTimestampDate(timestamp: string): string {
  return formatDate(toIsoDate(new Date(timestamp)))
}

/** O dia `days` dias antes de `date`, no formato do Postgres. */
export function isoDateDaysBefore(date: Date, days: number): string {
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - days))
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatPrice(value: number): string {
  return brl.format(value)
}

/** "Chegou em 27/10 · R$ 39,90", com o preço só quando informado. Usado nas chegadas da loja. */
export function formatArrival(arrivedOn: string, price: number | null): string {
  const day = formatDate(arrivedOn).slice(0, 5)
  return price === null ? `Chegou em ${day}` : `Chegou em ${day} · ${formatPrice(price)}`
}

// numeric(10,2) no banco: até 99.999.999,99.
const MAX_PRICE = 1e8

/**
 * Preço digitado no formato brasileiro ("R$ 39,90", "1.234,50", "39") para número. Também aceita ponto
 * decimal ("39.90"), que é o que o teclado numérico de alguns aparelhos oferece. Sem vírgula, um ponto
 * seguido de exatamente 3 dígitos é separador de milhar ("1.500" → 1500), como se escreve aqui.
 * Devolve `null` quando o texto não é um preço válido (vazio inclusive).
 */
export function parsePrice(text: string): number | null {
  const compact = text.replace(/R\$/i, '').replace(/\s/g, '')
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(compact)
      ? compact.replace(/\./g, '')
      : compact
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const value = Number(normalized)
  return value < MAX_PRICE ? value : null
}

/** Vazio é válido (o preço é opcional); qualquer outra coisa precisa ser um preço que `parsePrice` entenda. */
export function isPriceInputValid(text: string): boolean {
  return text.trim() === '' || parsePrice(text) !== null
}
