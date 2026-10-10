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
  editions: SeriesEdition[]
}

interface RawSeries {
  title: string
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
      .select('title, editions(id, title, publisher, volume, isbn13, cover_url, series_position, copies(id))')
      .eq('id', workId)
      .abortSignal(signal)
      .retry(false)
      .maybeSingle()
    if (error) throw status === 0 ? new NetworkError(error.message) : error
    if (!data) return null
    const raw = data as unknown as RawSeries
    return {
      title: raw.title,
      editions: raw.editions.map(({ copies, ...edition }) => ({ ...edition, myCopyId: copies[0]?.id ?? null })),
    }
  })
}

interface RawSeriesListRow {
  id: string
  title: string
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
      .select('id, title, editions!inner(title, volume, series_position, cover_url, copies(id))')
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
