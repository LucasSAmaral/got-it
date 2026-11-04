import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'

/**
 * Uma loja no diálogo: nome, data e preço à esquerda, botão de reserva à direita. Em tela estreita, onde os
 * dois não cabem lado a lado, o botão desce para a linha de baixo (flex-wrap) em vez de espremer o texto.
 */
export const StoreRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1, 2),
}))
