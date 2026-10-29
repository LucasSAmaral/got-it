import { Box, styled } from '@mui/material'
import type { ElementType } from 'react'

/** Página inteira: centraliza o cartão de login/cadastro, com largura máxima de formulário. */
export const AuthPageBox = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  maxWidth: 420,
  marginLeft: 'auto',
  marginRight: 'auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(0, 3),
  gap: theme.spacing(4),
}))

/** Cartão do formulário (usado com `component="form"`). */
export const AuthFormCard = styled(Box)<{ component?: ElementType }>(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 36, // o `borderRadius: 3` do sx de antes: 3 × theme.shape.borderRadius (12)
  padding: theme.spacing(3),
  boxShadow: theme.shadows[1],
}))
