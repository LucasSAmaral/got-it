import { Fab, Stack, styled } from '@mui/material'

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


/**
 * Filtro de leitura à esquerda e ordem à direita, embaixo da busca. Quebra a linha se não couber; em tela
 * larga acompanha a largura máxima da busca.
 */
export const ViewControls = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2.5),
  [theme.breakpoints.up('md')]: {
    maxWidth: 560,
  },
}))

export const ReadChips = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing(0.75),
}))
