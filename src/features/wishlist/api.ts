import { loadWishesMirror, saveWishesMirror } from '../../lib/mirrorStore'
import { supabase } from '../../lib/supabase'
import type { WishItem } from '../../types/catalog'
import { NetworkError, withinTimeout } from '../collection/api'

interface RawWishRow {
  id: string
  editions: {
    id: string
    title: string
    publisher: string | null
    isbn13: string | null
    volume: string | null
    cover_url: string | null
  } | null
}

/** `fromMirror`: o servidor não respondeu e a lista veio da cópia salva neste aparelho (ver `fetchCollection`). */
export interface WishlistResult {
  items: WishItem[]
  fromMirror: boolean
  savedAt: string | null
}

// Mesmo prazo da lista da coleção: no balcão da loja, com sinal ruim, a cópia precisa aparecer logo.
const WISHLIST_TIMEOUT_MS = 4000

async function fetchFromServer(signal: AbortSignal): Promise<WishItem[]> {
  // Sem partes de 1000 (como a coleção faz): uma lista de desejos com mais de 1000 gibis não é o caso de uso.
  const { data, error, status } = await supabase
    .from('wishes')
    .select('id, editions(id, title, publisher, isbn13, volume, cover_url)')
    .order('created_at', { ascending: false })
    .abortSignal(signal)
    // Sem a repetição automática do supabase-js, senão a cópia local demoraria vários segundos (ver api da coleção).
    .retry(false)
  if (error) throw status === 0 ? new NetworkError(error.message) : error

  return ((data ?? []) as unknown as RawWishRow[])
    .filter((row) => row.editions !== null)
    .map((row) => ({
      wish_id: row.id,
      edition_id: row.editions!.id,
      title: row.editions!.title,
      publisher: row.editions!.publisher,
      isbn13: row.editions!.isbn13,
      volume: row.editions!.volume,
      cover_url: row.editions!.cover_url,
    }))
}

/** A lista de desejos, mais recente primeiro. Atualiza a cópia offline; sem resposta do servidor, usa essa cópia. */
export async function fetchWishlist(): Promise<WishlistResult> {
  try {
    if (!navigator.onLine) throw new NetworkError('sem conexão')
    const items = await withinTimeout(WISHLIST_TIMEOUT_MS, fetchFromServer)
    saveWishesMirror(items).catch(() => {})
    return { items, fromMirror: false, savedAt: null }
  } catch (error) {
    if (!(error instanceof NetworkError)) throw error
    const mirror = await loadWishesMirror()
    if (!mirror) throw error
    return { items: mirror.items, fromMirror: true, savedAt: mirror.savedAt }
  }
}

/** Põe a edição na lista. Se ela já estava (toque repetido, outra aba), não é erro: o resultado é o mesmo. */
export async function addWish(editionId: string): Promise<void> {
  const { error } = await supabase.from('wishes').insert({ edition_id: editionId })
  if (error && error.code !== '23505') throw error
}

export async function removeWish(wishId: string): Promise<void> {
  const { error } = await supabase.from('wishes').delete().eq('id', wishId)
  if (error) throw error
}
