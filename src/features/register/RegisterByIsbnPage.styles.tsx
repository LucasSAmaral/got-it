import { Box, Chip, Stack, styled, Typography } from '@mui/material'
import type { ElementType } from 'react'
import { tokens } from '../../theme'

/** Painel da tela de cadastro: ocupa a tela toda no celular, vira coluna com borda em telas largas. */
export const RegisterPanel = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  marginLeft: 'auto',
  marginRight: 'auto',
  [theme.breakpoints.up('md')]: {
    maxWidth: 760,
    backgroundColor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}))

/** Rótulo pequeno acima de um campo ou grupo de campos (ex.: "ISBN", "Foto da capa"). */
export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.secondary,
}))

/** Linha com dois campos lado a lado (ex.: condição + data, editora + volume). */
export const FieldRow = styled(Stack)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}))

/** Selo "já existe no catálogo": o próximo usuário que escanear recebe tudo preenchido. */
export const FoundChip = styled(Chip)({
  alignSelf: 'flex-start',
  backgroundColor: 'rgba(163,118,15,0.12)',
  color: tokens.color.gold,
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: 10,
})

/** Selo "não encontramos": abre o formulário manual de cadastro. */
export const NotFoundChip = styled(Chip)({
  alignSelf: 'flex-start',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: 10,
})

/** Miniatura da capa escolhida, antes do envio. */
export const CoverPreview = styled(Box)<{ component?: ElementType; src?: string; alt?: string }>(({ theme }) => ({
  width: 64,
  height: 88,
  objectFit: 'cover',
  borderRadius: `${tokens.radius.sm}px`,
  border: `1px solid ${theme.palette.divider}`,
}))
