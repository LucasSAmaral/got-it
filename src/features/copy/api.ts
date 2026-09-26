import { supabase } from '../../lib/supabase'
import type { Copy, Edition } from '../../types/catalog'

export type CopyDetail = Pick<Copy, 'id' | 'condition' | 'acquired_at' | 'price_paid'> & {
  edition: Pick<Edition, 'title' | 'publisher' | 'volume' | 'format' | 'year' | 'isbn13' | 'cover_url'>
}

/** Um exemplar do usuário com os dados da edição. `null` quando não existe (ou é de outra pessoa: a RLS esconde). */
export async function fetchCopyDetail(copyId: string): Promise<CopyDetail | null> {
  const { data, error } = await supabase
    .from('copies')
    .select('id, condition, acquired_at, price_paid, edition:editions(title, publisher, volume, format, year, isbn13, cover_url)')
    .eq('id', copyId)
    .maybeSingle()
    // Sem rede, falha logo em vez de repetir por vários segundos (ver "Armadilhas conhecidas" no CLAUDE.md).
    .retry(false)
  if (error) throw error
  return data as unknown as CopyDetail | null
}
