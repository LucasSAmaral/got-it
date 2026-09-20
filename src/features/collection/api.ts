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

export async function fetchCollection(query: string): Promise<CollectionItem[]> {
  const trimmed = query.trim()

  if (trimmed) {
    const { data, error } = await supabase.rpc('search_my_collection', { q: trimmed })
    if (error) throw error
    return (data ?? []) as CollectionItem[]
  }

  const { data, error } = await supabase
    .from('copies')
    .select('id, status, condition, acquired_at, editions(id, title, publisher, isbn13, volume, cover_url)')
    .order('created_at', { ascending: false })

  if (error) throw error

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
