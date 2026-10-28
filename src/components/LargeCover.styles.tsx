import { Box, styled } from '@mui/material'
import { tokens } from '../theme'

/** Quadro da capa grande, centralizado, em proporção de gibi (2:3). A largura máxima vem de quem usa. */
export const CoverFrame = styled(Box)(({ theme }) => ({
  width: '100%',
  aspectRatio: '2 / 3',
  margin: '0 auto',
  borderRadius: `${tokens.radius.sm}px`,
  border: tokens.panel.border,
  boxShadow: tokens.panel.shadow,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))
