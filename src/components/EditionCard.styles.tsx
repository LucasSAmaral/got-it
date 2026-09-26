import { Box, styled, Typography } from '@mui/material'
import { tokens } from '../theme'

/** Espaço reservado da capa: mostra a imagem quando existe, senão as iniciais do título. */
export const CoverPlaceholder = styled(Box)(({ theme }) => ({
  width: 56,
  height: 76,
  flexShrink: 0,
  borderRadius: `${tokens.radius.sm}px`,
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}))

/** Título da edição: uma linha com reticências no celular, até duas linhas em tela larga. */
export const ClampedTitle = styled(Typography)(({ theme }) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block',
  WebkitBoxOrient: 'vertical',
  [theme.breakpoints.up('md')]: {
    whiteSpace: 'normal',
    display: '-webkit-box',
    WebkitLineClamp: 2,
  },
}))
