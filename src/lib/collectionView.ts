import type { CollectionItem } from '../types/catalog'
import { seriesSummariesFromCollection, type SeriesSummary } from './series'

/** Ordem da coleção. `recentes` é a ordem em que a lista chega (cadastro mais novo primeiro; na busca, relevância). */
export type CollectionOrder = 'recentes' | 'az' | 'serie'

/** Filtro de leitura da coleção. */
export type ReadFilter = 'todos' | 'nao-lidos' | 'lidos'

const ORDERS: readonly CollectionOrder[] = ['recentes', 'az', 'serie']
const READ_FILTERS: readonly ReadFilter[] = ['todos', 'nao-lidos', 'lidos']

/** `?ordem=` da URL. Ausente ou desconhecido vira `recentes`, o padrão. */
export function parseOrder(value: string | null): CollectionOrder {
  return ORDERS.find((order) => order === value) ?? 'recentes'
}

/** `?leitura=` da URL. Ausente ou desconhecido vira `todos`. */
export function parseReadFilter(value: string | null): ReadFilter {
  return READ_FILTERS.find((filter) => filter === value) ?? 'todos'
}

/**
 * Lidos ou não lidos. Cópia offline salva antes do "Lido" não tem `read`: conta como não lido, como a
 * coluna começa no banco.
 */
export function filterByRead(items: readonly CollectionItem[], filter: ReadFilter): CollectionItem[] {
  if (filter === 'todos') return [...items]
  const wantRead = filter === 'lidos'
  return items.filter((item) => (item.read ?? false) === wantRead)
}

// Ordem do português, sem separar acentos e caixa, e números como números: "Vol. 2" antes de "Vol. 10".
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

const byTitle = (a: CollectionItem, b: CollectionItem) => collator.compare(a.title, b.title)

/**
 * Não muda o array recebido. `recentes` mantém a ordem em que a lista chegou; `serie` não ordena aqui
 * (a tela monta um cartão por série com `collectionEntries`, que já sai em ordem alfabética).
 */
export function sortCollection(items: readonly CollectionItem[], order: CollectionOrder): CollectionItem[] {
  return order === 'az' ? [...items].sort(byTitle) : [...items]
}

/** Um cartão da coleção na ordem "Série": a série inteira, ou um exemplar que não está em série nenhuma. */
export type CollectionEntry =
  | { kind: 'series'; workId: string; title: string }
  | { kind: 'copy'; item: CollectionItem }

const entryTitle = (entry: CollectionEntry) => (entry.kind === 'series' ? entry.title : entry.item.title)

/**
 * Um cartão por série (os exemplares dela que passaram pela busca e pelo filtro) e um por exemplar sem
 * série, tudo junto em ordem alfabética. A paginação conta cartões, então uma série nunca se divide.
 */
export function collectionEntries(items: readonly CollectionItem[]): CollectionEntry[] {
  const seriesEntries = [...new Map(items.flatMap((item) => (item.work_id ? [[item.work_id, item.series_title ?? '']] : []))).entries()]
    .map(([workId, title]): CollectionEntry => ({ kind: 'series', workId, title }))
  const copyEntries = items.filter((item) => !item.work_id).map((item): CollectionEntry => ({ kind: 'copy', item }))
  return [...seriesEntries, ...copyEntries].sort((a, b) => collator.compare(entryTitle(a), entryTitle(b)))
}

/** O que o cartão de uma série mostra na coleção. */
export interface CollectionSeriesStats {
  summary: SeriesSummary
  read: number
  unread: number
}

/**
 * Resumo dos seus exemplares de uma série: capa, números que você tem (`seriesSummariesFromCollection`)
 * e quantos leu. Recebe todos os seus da série, não só os que passaram pelo filtro, para "você tem N"
 * não mudar ao filtrar. `null` se não há exemplar dela.
 */
export function collectionSeriesStats(mine: readonly CollectionItem[]): CollectionSeriesStats | null {
  const summary = seriesSummariesFromCollection([...mine])[0]
  if (!summary) return null
  const read = mine.filter((item) => item.read ?? false).length
  return { summary, read, unread: mine.length - read }
}

/**
 * Completa os resultados da busca com a série, que só vem na lista completa (`search_my_collection` não
 * traz). Item que não está na lista completa fica como veio.
 */
export function withSeriesFrom(items: readonly CollectionItem[], full: readonly CollectionItem[]): CollectionItem[] {
  const byCopy = new Map(full.map((item) => [item.copy_id, item]))
  return items.map((item) => {
    const source = byCopy.get(item.copy_id)
    if (!source || item.work_id !== undefined) return item
    return { ...item, work_id: source.work_id, series_title: source.series_title, series_position: source.series_position }
  })
}
