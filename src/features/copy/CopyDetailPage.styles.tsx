import { Box, Card, styled, Typography } from '@mui/material'
import type { ElementType } from 'react'
import { tokens } from '../../theme'

/** Capa grande no topo, centralizada na coluna (a mesma do título e dos blocos): até 280 px, em proporção de gibi (2:3). */
export const CoverFrame = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 280,
  aspectRatio: '2 / 3',
  margin: '0 auto',
  borderRadius: `${tokens.radius.md}px`,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

/** Bloco de dados ("Edição", "Seu exemplar") com o mesmo fundo e borda do cartão da coleção. */
export const SectionCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderColor: theme.palette.divider,
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

/** Título de cada bloco ("Edição", "Seu exemplar"). O `overline` do MUI é um `<span>`: sem `block`, a margem vertical some. */
export const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.secondary,
}))
