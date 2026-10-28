import { isSeriesPositionInputValid } from '../../lib/series'
import type { NewEditionInput } from './api'

/** Os campos da edição que a pessoa preenche (o ISBN vem do campo de cima, a capa vira URL no envio). */
export type NewEditionForm = Omit<NewEditionInput, 'isbn13' | 'coverUrl'>

export const EMPTY_EDITION_FORM: NewEditionForm = {
  title: '',
  publisher: '',
  volume: '',
  format: '',
  year: '',
  series: '',
  seriesPosition: '',
}

/** O formulário de edição nova deixa salvar: título preenchido e nº na série vazio ou inteiro. */
export function isNewEditionFormValid(form: NewEditionForm): boolean {
  return form.title.trim() !== '' && isSeriesPositionInputValid(form.seriesPosition)
}
