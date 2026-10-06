import { supabase } from '../../lib/supabase'
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
