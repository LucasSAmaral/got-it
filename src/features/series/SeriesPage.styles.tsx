import { styled, Typography } from '@mui/material'
import { EditionGrid } from '../../components/EditionGrid'

/** "Nº 1", "Nº 2"… acima das edições de cada posição. O `overline` do MUI é um `<span>`: sem `block`, a margem some. */
export const SlotTitle = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
}))

/**
 * Os números da série lado a lado em tela larga, cada um com o título em cima. Sem espaço extra entre as
 * linhas: a margem do `SlotTitle` já separa um número do outro (no celular fica igual a antes).
 */
export const SlotGrid = styled(EditionGrid)({ rowGap: 0 })
