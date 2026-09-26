import { Box, styled } from '@mui/material'

/** Grade responsiva de cartões de edição: uma coluna no celular, várias em tela larga. */
export const EditionGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1.5),
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  },
}))
