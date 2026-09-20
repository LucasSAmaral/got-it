export type CopyStatus = 'collection' | 'for_sale' | 'for_trade'

export interface Edition {
  id: string
  work_id: string | null
  title: string
  volume: string | null
  publisher: string | null
  country: string
  language: string
  format: string | null
  isbn13: string | null
  cover_url: string | null
  year: number | null
  verified: boolean
  created_by: string | null
  created_at: string
}

export interface Copy {
  id: string
  user_id: string
  edition_id: string
  condition: string | null
  price_paid: number | null
  status: CopyStatus
  acquired_at: string | null
  notes: string | null
  created_at: string
}

/** Uma linha da coleção do usuário já combinada com os dados da edição. */
export interface CollectionItem {
  copy_id: string
  edition_id: string
  title: string
  publisher: string | null
  isbn13: string | null
  volume: string | null
  cover_url: string | null
  status: CopyStatus
  condition: string | null
  acquired_at: string | null
}
