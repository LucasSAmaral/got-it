import { Box, Fab, styled, TextField } from '@mui/material'

/** Campo de busca arredondado da coleção (mesma pílula do "Eu tenho?", com largura máxima em tela larga). */
export const SearchField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  '& .MuiOutlinedInput-root': { borderRadius: 999 },
  [theme.breakpoints.up('md')]: {
    maxWidth: 560,
  },
}))

/** Grade responsiva dos exemplares: uma coluna no celular, várias em tela larga. */
export const CollectionGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.5),
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  },
}))

/** Botão de cadastrar novo exemplar, fixo no canto — só no celular (no desktop já tem na barra lateral). */
export const AddFab = styled(Fab)(({ theme }) => ({
  display: 'flex',
  position: 'fixed',
  right: 20,
  bottom: 88,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}))
