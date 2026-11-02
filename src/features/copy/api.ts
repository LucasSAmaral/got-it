import { supabase } from '../../lib/supabase'
import { copyColumns, type CopyFormInput } from '../register/api'
import type { Copy, Edition } from '../../types/catalog'

/** Os dados da edição que o detalhe do exemplar e o da edição mostram. */
export type EditionInfo = Pick<
  Edition,
  | 'id'
  | 'title'
  | 'publisher'
  | 'volume'
  | 'format'
  | 'year'
  | 'isbn13'
  | 'cover_url'
  | 'series_position'
  | 'work_id'
  | 'synopsis'
  | 'synopsis_source'
> & {
  work: { title: string } | null
  /** Capas que esta pessoa enviou para a edição, com a situação na fila (a RLS só mostra as dela). */
  cover_submissions: { status: 'pending' | 'approved' | 'rejected' | 'published' }[]
}

const EDITION_INFO_COLUMNS =
  'id, title, publisher, volume, format, year, isbn13, cover_url, series_position, work_id, synopsis, synopsis_source, work:works(title), cover_submissions(status)'

export type CopyDetail = Pick<Copy, 'id' | 'condition' | 'acquired_at' | 'price_paid' | 'read'> & {
  edition: EditionInfo
}

/** Uma edição do catálogo, com os exemplares dela que a pessoa tem (a RLS de `copies` só devolve os seus). */
export type EditionDetail = EditionInfo & { copies: { id: string }[] }

/** Uma edição do catálogo pelo id. `null` quando não existe. */
export async function fetchEditionDetail(editionId: string): Promise<EditionDetail | null> {
  const { data, error } = await supabase
    .from('editions')
    .select(`${EDITION_INFO_COLUMNS}, copies(id)`)
    .eq('id', editionId)
    .maybeSingle()
    .retry(false)
  if (error) throw error
  return data as unknown as EditionDetail | null
}

/** Um exemplar do usuário com os dados da edição. `null` quando não existe (ou é de outra pessoa: a RLS esconde). */
export async function fetchCopyDetail(copyId: string): Promise<CopyDetail | null> {
  const { data, error } = await supabase
    .from('copies')
    .select(
      `id, condition, acquired_at, price_paid, read, edition:editions(${EDITION_INFO_COLUMNS})`,
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

export async function updateCopyRead(copyId: string, read: boolean): Promise<void> {
  const { error } = await supabase.from('copies').update({ read }).eq('id', copyId)
  if (error) throw error
}
