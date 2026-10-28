import { Box, Stack, styled } from '@mui/material'

/** Apresentação do app para quem ainda não entrou. */
export const Hero = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  maxWidth: 640,
  marginBottom: theme.spacing(6),
}))

export const FeatureList = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}))

/** Ícone + frase de uma funcionalidade. */
export const Feature = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& > svg': { color: theme.palette.primary.main, flexShrink: 0 },
}))
