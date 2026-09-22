import { supabase } from '../../lib/supabase'
import type { Edition } from '../../types/catalog'

export type EditionSummary = Pick<
  Edition,
  'id' | 'title' | 'publisher' | 'isbn13' | 'volume' | 'format' | 'year' | 'cover_url' | 'verified' | 'created_at'
>

/** Busca no catálogo inteiro (não só na coleção do usuário). Vazio devolve tudo, mais recente primeiro. */
export async function searchEditions(query: string): Promise<EditionSummary[]> {
  const { data, error } = await supabase.rpc('search_editions', { q: query.trim() })
  if (error) throw error
  return (data ?? []) as EditionSummary[]
}

export interface EditionFormInput {
  title: string
  publisher: string
  volume: string
  format: string
  year: string
}

export async function updateEdition(id: string, form: EditionFormInput, coverUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from('editions')
    .update({
      title: form.title,
      publisher: form.publisher || null,
      volume: form.volume || null,
      format: form.format || null,
      year: form.year ? Number(form.year) : null,
      ...(coverUrl ? { cover_url: coverUrl } : {}),
    })
    .eq('id', id)
  if (error) throw error
}
