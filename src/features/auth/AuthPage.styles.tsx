import { Box, styled } from '@mui/material'

/** Página inteira: centraliza o cartão de login, com largura máxima de formulário. */
export const LoginPageBox = styled(Box)(({ theme }) => ({
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
