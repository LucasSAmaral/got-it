import { styled, Typography, type SxProps, type Theme } from '@mui/material'
import type { ElementType, ReactNode } from 'react'
import { tokens } from '../theme'

const NarrationBox = styled(Typography)<{ component?: ElementType }>(({ theme }) => ({
  display: 'inline-block',
  alignSelf: 'flex-start',
  padding: theme.spacing(0.25, 1.25),
  backgroundColor: tokens.color.caption,
  color: tokens.color.ink,
  border: tokens.panel.border,
  boxShadow: tokens.panel.shadowSmall,
  fontFamily: tokens.font.display,
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '20px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}))

type NarrationTitleProps = {
  children: ReactNode
  /** Nível do título na página; `h2` por padrão. */
  component?: ElementType
  sx?: SxProps<Theme>
}

/**
 * Título de seção como caixa de narração de HQ (retângulo amarelo com contorno, em maiúsculas). Usado no
 * Início, na vitrine do admin, no detalhe do exemplar e nos números da página da série.
 */
export function NarrationTitle({ children, component = 'h2', sx }: NarrationTitleProps) {
  return (
    <NarrationBox component={component} sx={sx}>
      {children}
    </NarrationBox>
  )
}
