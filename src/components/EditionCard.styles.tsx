import { Box, CardActionArea, styled, Typography } from '@mui/material'
import type { ElementType } from 'react'
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

const cardBody = { display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 } as const

/** Capa + texto do cartão, quando ele não abre nada. */
export const CardBody = styled(Box)(cardBody)

/**
 * Capa + texto do cartão como link (ex.: para o detalhe do exemplar). Sem o fundo cinza do MUI no hover;
 * o destaque de foco pelo teclado (Tab) continua.
 */
export const CardLink = styled(CardActionArea)<{ component?: ElementType; to?: string }>({
  ...cardBody,
  justifyContent: 'flex-start',
  borderRadius: tokens.radius.sm,
  '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0 },
})
