import { styled, Typography } from '@mui/material'

/** "Nº 1", "Nº 2"… acima das edições de cada posição. O `overline` do MUI é um `<span>`: sem `block`, a margem some. */
export const SlotTitle = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
}))
