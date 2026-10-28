import { Stack, styled } from '@mui/material'

/** Selo e botão de reserva, empilhados no canto do cartão. */
export const CardActions = styled(Stack)(({ theme }) => ({
  alignSelf: 'stretch',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
}))
