import { Box, Stack, styled } from '@mui/material'

/** Página inteira, fora do `AppLayout` (quem chega pelo link pode não ter conta): rola sozinha. */
export const StorePageRoot = styled(Box)({
  height: '100%',
  overflowY: 'auto',
})

export const StorePageContent = styled(Box)(({ theme }) => ({
  maxWidth: 1120,
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: theme.spacing(3, 2.5, 6),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4, 5, 8),
  },
}))

/** Nome do app à esquerda, entrar ou ir para a coleção à direita. */
export const StoreHeader = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(4),
}))

/** Selo e botão de reserva, empilhados no canto do cartão. */
export const CardActions = styled(Stack)(({ theme }) => ({
  alignSelf: 'stretch',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
}))
