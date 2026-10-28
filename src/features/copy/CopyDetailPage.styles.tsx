import { Box, Card, styled } from '@mui/material'
import type { ElementType } from 'react'

/** Bloco de dados ("Edição", "Seu exemplar") com o mesmo fundo e borda do cartão da coleção. */
export const SectionCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
}))

/** Lista rótulo → valor dos dados (editora, volume, ISBN…). Coluna do rótulo fixa para as duas listas ficarem alinhadas. */
export const DetailList = styled(Box)<{ component?: ElementType }>(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '120px 1fr',
  columnGap: theme.spacing(3),
  rowGap: theme.spacing(1.25),
  margin: 0,
  '& dd': { margin: 0 },
}))

