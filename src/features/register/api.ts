import { supabase } from '../../lib/supabase'
import type { Edition } from '../../types/catalog'

export class DuplicateIsbnError extends Error {}

export interface CopyFormInput {
  condition: string
  acquiredAt: string
  pricePaid: string
}

export interface NewEditionInput {
  isbn13: string
  title: string
  publisher: string
  volume: string
  format: string
  year: string
  coverUrl: string
}

export async function uploadCoverImage(file: File, isbn13: string): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg'
  const path = `${isbn13}-${Date.now()}.${extension}`

  const { error } = await supabase.storage.from('covers').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('covers').getPublicUrl(path)
  return data.publicUrl
}

function toCopyRow(editionId: string, form: CopyFormInput) {
  return {
    edition_id: editionId,
    condition: form.condition || null,
    acquired_at: form.acquiredAt || null,
    price_paid: form.pricePaid ? Number(form.pricePaid.replace(',', '.')) : null,
  }
}

export async function fetchEditionByIsbn(isbn13: string): Promise<Edition | null> {
  const { data, error } = await supabase.from('editions').select('*').eq('isbn13', isbn13).maybeSingle()
  if (error) throw error
  return data as Edition | null
}

export async function fetchMyCopyCount(editionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('edition_id', editionId)
  if (error) throw error
  return count ?? 0
}

export async function addCopyToExistingEdition(editionId: string, form: CopyFormInput) {
  const { error } = await supabase.from('copies').insert(toCopyRow(editionId, form))
  if (error) throw error
}

export async function createEditionAndCopy(edition: NewEditionInput, form: CopyFormInput) {
  const { data, error } = await supabase
    .from('editions')
    .insert({
      isbn13: edition.isbn13,
      title: edition.title,
      publisher: edition.publisher || null,
      volume: edition.volume || null,
      format: edition.format || null,
      year: edition.year ? Number(edition.year) : null,
      cover_url: edition.coverUrl || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new DuplicateIsbnError()
    }
    throw error
  }

  await addCopyToExistingEdition(data.id, form)
}
