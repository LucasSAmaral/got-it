import { isoDateDaysBefore, parsePrice } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import type { Edition } from '../../types/catalog'

/** Por quantos dias uma chegada fica na vitrine. Não há "esgotado": depois disso ela sai sozinha. */
export const ARRIVAL_WINDOW_DAYS = 30

export class DuplicateArrivalError extends Error {}

export interface Store {
  id: string
  name: string
  slug: string
  whatsapp: string | null
  instagram: string | null
}

export interface StoreArrival {
  id: string
  arrived_on: string
  price: number | null
  edition: Pick<Edition, 'id' | 'title' | 'publisher' | 'volume' | 'isbn13' | 'cover_url'>
}

export interface ArrivalFormInput {
  arrivedOn: string
  price: string
}

export async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase.from('stores').select('id, name, slug, whatsapp, instagram').order('name')
  if (error) throw error
  return (data ?? []) as Store[]
}

/** `null` quando não existe loja com esse endereço. */
export async function fetchStore(slug: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, slug, whatsapp, instagram')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as Store | null
}

/** Chegadas dos últimos `ARRIVAL_WINDOW_DAYS` dias, mais recentes primeiro, com a edição embutida. */
export async function fetchRecentArrivals(storeId: string, today = new Date()): Promise<StoreArrival[]> {
  const { data, error } = await supabase
    .from('store_arrivals')
    .select('id, arrived_on, price, edition:editions(id, title, publisher, volume, isbn13, cover_url)')
    .eq('store_id', storeId)
    .gte('arrived_on', isoDateDaysBefore(today, ARRIVAL_WINDOW_DAYS))
    .order('arrived_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as StoreArrival[]
}

/** Registra a chegada; `DuplicateArrivalError` quando a edição já foi registrada nessa loja nesse dia. */
export async function createArrival(storeId: string, editionId: string, form: ArrivalFormInput): Promise<void> {
  const { error } = await supabase.from('store_arrivals').insert({
    store_id: storeId,
    edition_id: editionId,
    arrived_on: form.arrivedOn,
    // O formulário só deixa salvar com preço vazio ou válido (`PriceField`).
    price: parsePrice(form.price),
  })
  if (error) {
    if (error.code === '23505') throw new DuplicateArrivalError()
    throw error
  }
}

/**
 * Apaga uma chegada registrada por engano. Delete barrado pela RLS não dá erro no PostgREST (só afeta 0
 * linhas), então confere se voltou a linha apagada.
 */
export async function deleteArrival(id: string): Promise<void> {
  const { data, error } = await supabase.from('store_arrivals').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('A chegada não foi apagada.')
}

/**
 * Quais dessas edições quem está logado tem (para "Tenho" / "Falta esse" na vitrine). A RLS de `copies`
 * já devolve só os exemplares de quem pergunta. Só chamar com sessão: sem ela o pedido é recusado.
 */
export async function fetchOwnedEditionIds(editionIds: string[]): Promise<Set<string>> {
  if (editionIds.length === 0) return new Set()
  const { data, error } = await supabase.from('copies').select('edition_id').in('edition_id', editionIds)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.edition_id as string))
}
