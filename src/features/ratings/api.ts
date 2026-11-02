import type { RatingStats } from '../../lib/format'
import { supabase } from '../../lib/supabase'

interface RawStatsRow {
  average: number | string
  ratings: number
}

// O PostgREST manda `numeric` como número, mas `Number()` também cobre texto, se a configuração mudar.
function toStats(row: RawStatsRow): RatingStats {
  return { average: Number(row.average), ratings: row.ratings }
}

/** A sua nota da edição (1 a 5), ou `null` se você não avaliou. A RLS só devolve as suas. */
export async function fetchMyRating(editionId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('ratings')
    .select('stars')
    .eq('edition_id', editionId)
    .maybeSingle()
    .retry(false)
  if (error) throw error
  return (data?.stars as number | undefined) ?? null
}

/** Dá ou muda a sua nota (uma por edição: upsert pela chave `user_id, edition_id`). */
export async function saveMyRating(editionId: string, stars: number): Promise<void> {
  const { error } = await supabase
    .from('ratings')
    .upsert({ edition_id: editionId, stars }, { onConflict: 'user_id,edition_id' })
  if (error) throw error
}

export async function removeMyRating(editionId: string): Promise<void> {
  const { error } = await supabase.from('ratings').delete().eq('edition_id', editionId)
  if (error) throw error
}

/** Média e contagem de cada edição pedida; edição sem nota fica fora do mapa. */
export async function fetchEditionRatingStats(editionIds: string[]): Promise<Map<string, RatingStats>> {
  if (editionIds.length === 0) return new Map()
  const { data, error } = await supabase.rpc('edition_rating_stats', { p_edition_ids: editionIds }).retry(false)
  if (error) throw error
  return new Map(
    ((data ?? []) as (RawStatsRow & { edition_id: string })[]).map((row) => [row.edition_id, toStats(row)]),
  )
}

/** Média e contagem de cada série com alguma nota (todas as notas das edições dela juntas). */
export async function fetchSeriesRatingStats(): Promise<Map<string, RatingStats>> {
  const { data, error } = await supabase.rpc('series_rating_stats').retry(false)
  if (error) throw error
  return new Map(((data ?? []) as (RawStatsRow & { work_id: string })[]).map((row) => [row.work_id, toStats(row)]))
}
