import { Stack, styled } from '@mui/material'
import { EditionGrid } from '../../components/EditionGrid'

/**
 * Os números da série lado a lado em tela larga, cada um com o título em cima. Sem espaço extra entre as
 * linhas: a margem do título de cada número (`NarrationTitle`) já separa um número do outro.
 */
export const SlotGrid = styled(EditionGrid)({ rowGap: 0 })

/** Coluna da direita do cartão, com o selo no alto. Estica até a altura do cartão. */
export const CardActions = styled(Stack)({
  alignSelf: 'stretch',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  flexShrink: 0,
})
