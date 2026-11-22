import { supabase } from '../../lib/supabase'
import { sortSeriesByTitle, summarizeSeries, type SeriesSummary } from '../../lib/series'
import type { Edition } from '../../types/catalog'
import { NetworkError, withinTimeout } from '../collection/api'

export type SeriesEdition = Pick<
  Edition,
  'id' | 'title' | 'publisher' | 'volume' | 'isbn13' | 'cover_url' | 'series_position'
> & {
  /** Um exemplar seu desta edição (para abrir o detalhe); `null` quando você não tem. */
  myCopyId: string | null
}

export interface Series {
  title: string
  /** Quantos números a série tem ao todo; `null` quando não se sabe. Só o admin preenche. */
  totalVolumes: number | null
  /** A série terminou: não terá mais lançamentos. Só o admin marca. */
  completed: boolean
  editions: SeriesEdition[]
}

interface RawSeries {
  title: string
  total_volumes: number | null
  completed: boolean
  editions: (Omit<SeriesEdition, 'myCopyId'> & { copies: { id: string }[] })[]
}

const SERIES_TIMEOUT_MS = 4000

/**
 * A série com todas as edições do catálogo e, em cada uma, os seus exemplares. Uma consulta só: o
 * PostgREST embute editions → copies pelas chaves estrangeiras, e a RLS de `copies` já deixa só os
 * exemplares de quem pergunta, então `copies` vazio quer dizer "você não tem". `null` quando a série
 * não existe. Sem resposta do servidor lança `NetworkError` (a página cai para o que está no aparelho).
 */
export async function fetchSeries(workId: string): Promise<Series | null> {
  return withinTimeout(SERIES_TIMEOUT_MS, async (signal) => {
    const { data, error, status } = await supabase
      .from('works')
      .select('title, total_volumes, completed, editions(id, title, publisher, volume, isbn13, cover_url, series_position, copies(id))')
      .eq('id', workId)
      .abortSignal(signal)
      .retry(false)
      .maybeSingle()
    if (error) throw status === 0 ? new NetworkError(error.message) : error
    if (!data) return null
    const raw = data as unknown as RawSeries
    return {
      title: raw.title,
      totalVolumes: raw.total_volumes,
      completed: raw.completed,
      editions: raw.editions.map(({ copies, ...edition }) => ({ ...edition, myCopyId: copies[0]?.id ?? null })),
    }
  })
}

interface RawSeriesListRow {
  id: string
  title: string
  total_volumes: number | null
  completed: boolean
  editions: { title: string; volume: string | null; series_position: number | null; cover_url: string | null; copies: { id: string }[] }[]
}

/**
 * Todas as séries com pelo menos uma edição (`editions!inner` descarta as que ficaram sem edição), já
 * resumidas e em ordem alfabética. Mesma ideia de `fetchSeries`: a RLS de `copies` só devolve os seus.
 * Sem resposta do servidor lança `NetworkError` (a página cai para as suas, a partir da coleção).
 */
export async function fetchSeriesList(): Promise<SeriesSummary[]> {
  return withinTimeout(SERIES_TIMEOUT_MS, async (signal) => {
    const { data, error, status } = await supabase
      .from('works')
      .select('id, title, total_volumes, completed, editions!inner(title, volume, series_position, cover_url, copies(id))')
      .abortSignal(signal)
      .retry(false)
    if (error) throw status === 0 ? new NetworkError(error.message) : error
    const rows = (data ?? []) as unknown as RawSeriesListRow[]
    return sortSeriesByTitle(
      rows.map(({ editions, ...work }) =>
        summarizeSeries({
          ...work,
          editions: editions.map(({ copies, ...edition }) => ({ ...edition, owned: copies.length > 0 })),
        }),
      ),
    )
  })
}

export interface SeriesChanges {
  title: string
  totalVolumes: number | null
  completed: boolean
}

/** Já existe outra série com o nome (o banco compara sem diferenciar maiúsculas e sem espaços nas pontas). */
export class DuplicateSeriesTitleError extends Error {}

/**
 * Nome, total de números e "série completa" (só o admin: a RLS de `works` só deixa ele atualizar).
 * Update bloqueado pela RLS não dá erro no PostgREST, só não afeta linha: por isso o `.select()` e a
 * conferência de que voltou a série, para nunca dizer "salvo" sem ter salvado.
 */
export async function updateSeries(workId: string, changes: SeriesChanges): Promise<void> {
  const { data, error } = await supabase
    .from('works')
    .update({ title: changes.title.trim(), total_volumes: changes.totalVolumes, completed: changes.completed })
    .eq('id', workId)
    .select('id')
  // 23505: violou o índice único do nome (works_title_key).
  if (error?.code === '23505') throw new DuplicateSeriesTitleError(error.message)
  if (error) throw error
  if (!data || data.length === 0) throw new Error('A série não foi atualizada (sem permissão ou não existe).')
}
