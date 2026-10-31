import { Box, Card, CardActionArea, styled, Typography } from '@mui/material'
import type { ElementType } from 'react'
import { tokens } from '../theme'

/** Moldura do cartão (edição na coleção/admin/série, série na listagem). */
export const CardFrame = styled(Card)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  gap: theme.spacing(1.5),
  alignItems: 'center',
  padding: theme.spacing(1.5),
}))

/** Espaço reservado da capa: mostra a imagem quando existe, senão as iniciais do título. */
export const CoverPlaceholder = styled(Box)(({ theme }) => ({
  width: 56,
  height: 76,
  flexShrink: 0,
  borderRadius: `${tokens.radius.sm}px`,
  backgroundColor: theme.palette.background.default,
  border: `1.5px solid ${tokens.color.ink}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}))

/**
 * Título da edição: uma linha com reticências no celular, até duas linhas em tela larga. Na tela larga reserva
 * sempre as duas linhas, para os cartões lado a lado terem a mesma altura com título curto ou longo.
 */
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
    minHeight: `calc(2 * ${theme.typography.h4.lineHeight})`,
  },
}))

/**
 * Ação no canto de cima (ex.: lixeira da coleção), fora do fluxo do cartão: assim ela não vira uma coluna da
 * altura do cartão, e as linhas de baixo (com o selo) vão até a borda. O título reserva `CORNER_ACTION_SPACE`.
 */
export const CornerAction = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
}))

/** Espaço à direita do título quando há `CornerAction`: o botão pequeno (30 px) mais um respiro. */
export const CORNER_ACTION_SPACE = 4.5

/** ISBN à esquerda e o selo (se houver) à direita, na mesma linha, no canto de baixo do cartão. */
export const BadgeRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
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
