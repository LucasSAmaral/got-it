import { Box, Card, styled } from '@mui/material'

/** Apresentação do app para quem ainda não entrou. */
export const Hero = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(6),
}))

/** Os dois propósitos lado a lado em tela larga, um embaixo do outro no celular. */
export const PurposeGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2.5),
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: '1fr 1fr',
  },
}))

/** Um propósito num quadro de HQ: caixa de narração em cima e o texto embaixo. */
export const Purpose = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2.5),
}))
