import { searchLocal } from '../../lib/localSearch'
import { loadMirror, saveMirror } from '../../lib/mirrorStore'
import { supabase } from '../../lib/supabase'
import type { CollectionItem, CopyStatus } from '../../types/catalog'

interface RawCopyRow {
  id: string
  status: CopyStatus
  condition: string | null
  acquired_at: string | null
  editions: {
    id: string
    title: string
    publisher: string | null
    isbn13: string | null
    volume: string | null
    cover_url: string | null
  } | null
}

/** `fromMirror` indica que o servidor não respondeu e o resultado veio da cópia salva neste aparelho. */
export interface CollectionResult {
  items: CollectionItem[]
  fromMirror: boolean
  savedAt: string | null
}

// "Eu tenho?" precisa responder em até 3 s mesmo com sinal ruim; a lista completa pode esperar um pouco mais.
const SEARCH_TIMEOUT_MS = 2000
const LIST_TIMEOUT_MS = 4000

/** O servidor não respondeu (sem rede, sem sessão para perguntar ou tempo esgotado), diferente de um erro que ele devolve. */
class NetworkError extends Error {}

async function fetchFromServer(query: string, signal: AbortSignal): Promise<CollectionItem[]> {
  if (query) {
    const { data, error, status } = await supabase.rpc('search_my_collection', { q: query }).abortSignal(signal)
    if (error) throw status === 0 ? new NetworkError(error.message) : error
    return (data ?? []) as CollectionItem[]
  }

  const { data, error, status } = await supabase
    .from('copies')
    .select('id, status, condition, acquired_at, editions(id, title, publisher, isbn13, volume, cover_url)')
    .order('created_at', { ascending: false })
    .abortSignal(signal)
    // Sem isso o supabase-js repete o GET com espera crescente (1 s, 2 s, 4 s) quando a rede falha,
    // e o fallback para a cópia local só entraria depois de vários segundos.
    .retry(false)

  if (error) throw status === 0 ? new NetworkError(error.message) : error

  return ((data ?? []) as unknown as RawCopyRow[])
    .filter((row) => row.editions !== null)
    .map((row) => ({
      copy_id: row.id,
      edition_id: row.editions!.id,
      title: row.editions!.title,
      publisher: row.editions!.publisher,
      isbn13: row.editions!.isbn13,
      volume: row.editions!.volume,
      cover_url: row.editions!.cover_url,
      status: row.status,
      condition: row.condition,
      acquired_at: row.acquired_at,
    }))
}

/**
 * Sem rede o supabase-js ainda pode passar até ~30 s tentando renovar o token antes de fazer o pedido, e
 * o AbortSignal só vale depois disso. Por isso o prazo vale para tudo, autenticação inclusa.
 */
async function withinTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const expired = new Promise<never>((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(new NetworkError('tempo esgotado')), { once: true })
  })
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await Promise.race([run(controller.signal), expired])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Busca no servidor. A lista completa (sem termo) também atualiza a cópia local; se o servidor não
 * responder, usa essa cópia. Erros que o servidor devolve de fato continuam sendo erros.
 */
export async function fetchCollection(query: string): Promise<CollectionResult> {
  const trimmed = query.trim()

  try {
    // Sem rede nenhuma não há o que esperar: vai direto para a cópia.
    if (!navigator.onLine) throw new NetworkError('sem conexão')
    const items = await withinTimeout(trimmed ? SEARCH_TIMEOUT_MS : LIST_TIMEOUT_MS, (signal) =>
      fetchFromServer(trimmed, signal),
    )
    if (!trimmed) saveMirror(items).catch(() => {})
    return { items, fromMirror: false, savedAt: null }
  } catch (error) {
    if (!(error instanceof NetworkError)) throw error
    const mirror = await loadMirror()
    if (!mirror) throw error
    return { items: searchLocal(mirror.items, trimmed), fromMirror: true, savedAt: mirror.savedAt }
  }
}

export async function deleteCopy(copyId: string): Promise<void> {
  const { error } = await supabase.from('copies').delete().eq('id', copyId)
  if (error) throw error
}
