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

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatPrice(value: number): string {
  return brl.format(value)
}
