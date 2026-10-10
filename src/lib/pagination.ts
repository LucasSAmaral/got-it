/** 15 fecha a grade com 1 ou 3 colunas. */
export const PAGE_SIZE = 15

/** Número da página vindo da URL (`?pagina=2`). Ausente ou inválido vira 1. */
export function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/**
 * Os itens de uma página. A página pedida é limitada ao intervalo que existe: depois de excluir o último
 * item da última página, ou com um `?pagina=` velho na URL, mostra a última em vez de uma página vazia.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(page, 1), pageCount)
  const start = (current - 1) * pageSize
  return { pageItems: items.slice(start, start + pageSize), page: current, pageCount }
}
