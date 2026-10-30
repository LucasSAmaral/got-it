import { supabase } from '../../lib/supabase'
import { copyColumns, type CopyFormInput } from '../register/api'
import type { Copy, Edition } from '../../types/catalog'

export type CopyDetail = Pick<Copy, 'id' | 'condition' | 'acquired_at' | 'price_paid'> & {
  edition: Pick<Edition, 'id' | 'title' | 'publisher' | 'volume' | 'format' | 'year' | 'isbn13' | 'cover_url' | 'series_position' | 'work_id'> & {
    work: { title: string } | null
    /** Capas enviadas por esta pessoa esperando revisão (a RLS só mostra as dela). */
    cover_submissions: { id: string }[]
  }
}

/** Um exemplar do usuário com os dados da edição. `null` quando não existe (ou é de outra pessoa: a RLS esconde). */
export async function fetchCopyDetail(copyId: string): Promise<CopyDetail | null> {
  const { data, error } = await supabase
    .from('copies')
    .select(
      'id, condition, acquired_at, price_paid, edition:editions(id, title, publisher, volume, format, year, isbn13, cover_url, series_position, work_id, work:works(title), cover_submissions(id))',
    )
    .eq('id', copyId)
    .maybeSingle()
    // Sem rede, falha logo em vez de repetir por vários segundos (ver "Armadilhas conhecidas" no CLAUDE.md).
    .retry(false)
  if (error) throw error
  return data as unknown as CopyDetail | null
}

/** O exemplar no formato do formulário (o mesmo do cadastro). Preço com vírgula, como o usuário digita. */
export function copyFormFromDetail(detail: CopyDetail): CopyFormInput {
  return {
    condition: detail.condition ?? '',
    acquiredAt: detail.acquired_at ?? '',
    pricePaid: detail.price_paid !== null ? detail.price_paid.toFixed(2).replace('.', ',') : '',
  }
}

export async function updateCopy(copyId: string, form: CopyFormInput): Promise<void> {
  const { error } = await supabase.from('copies').update(copyColumns(form)).eq('id', copyId)
  if (error) throw error
}
