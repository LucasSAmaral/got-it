import { Stack, styled, TextField } from '@mui/material'

/** Campo de busca arredondado, com borda na cor primária (igual ao usado no ISBN). */
export const SearchField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  '& .MuiOutlinedInput-root': {
    borderRadius: 999,
    borderColor: theme.palette.primary.main,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  },
}))

/** Cartão tracejado do estado "ainda não tem", com o botão de cadastrar. */
export const EmptyStateCard = styled(Stack)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  // No sx, `borderRadius: 3` multiplica por theme.shape.borderRadius (12 no nosso tema) — não por theme.spacing.
  borderRadius: 36,
  padding: theme.spacing(2.5),
  border: `1px dashed ${theme.palette.divider}`,
}))
