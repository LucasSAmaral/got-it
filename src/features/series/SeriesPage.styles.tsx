import { styled } from '@mui/material'
import { EditionGrid } from '../../components/EditionGrid'

/**
 * Os números da série lado a lado em tela larga, cada um com o título em cima. Sem espaço extra entre as
 * linhas: a margem do título de cada número (`NarrationTitle`) já separa um número do outro.
 */
export const SlotGrid = styled(EditionGrid)({ rowGap: 0 })
