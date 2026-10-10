import { Fab, Pagination, styled } from '@mui/material'

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

/** Paginação abaixo dos cartões, centralizada. */
export const CollectionPagination = styled(Pagination)(({ theme }) => ({
  marginTop: theme.spacing(3),
  '& .MuiPagination-ul': {
    justifyContent: 'center',
  },
}))
