import { Stack, styled } from '@mui/material'

// Mesma margem do Início: cada página põe a própria, e o layout não dá nenhuma. A largura máxima
// inclui a margem (border-box): 720 px de texto mais 40 px de cada lado.
export const PrivacyPageStack = styled(Stack)(({ theme }) => ({
  maxWidth: 800,
  padding: theme.spacing(4, 2.5),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(5),
  },
}))
