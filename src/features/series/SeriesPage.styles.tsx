import { Stack, styled } from '@mui/material'
import { EditionGrid } from '../../components/EditionGrid'

/**
 * Os números da série lado a lado em tela larga, cada um com o título em cima. Sem espaço extra entre as
 * linhas: a margem do título de cada número (`NarrationTitle`) já separa um número do outro.
 */
export const SlotGrid = styled(EditionGrid)({ rowGap: 0 })

/**
 * Coluna da direita do cartão: o selo no alto e, quando você não tem a edição, o "Adicionar" embaixo, na
 * altura do ISBN. Estica até a altura do cartão para os dois ficarem nas pontas.
 */
export const CardActions = styled(Stack)({
  alignSelf: 'stretch',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  flexShrink: 0,
})
