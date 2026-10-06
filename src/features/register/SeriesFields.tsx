import { Autocomplete, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { isSeriesPositionInputValid } from '../../lib/series'
import { fetchSeriesTitles } from './api'

type SeriesFieldsProps = {
  series: string
  position: string
  onSeriesChange: (series: string) => void
  onPositionChange: (position: string) => void
}

/**
 * Série (com sugestões das já existentes, aceitando nome novo) e "Nº na série". A série é a história,
 * não a coleção de uma editora: pode juntar publicações diferentes. O nº só é preciso quando o volume
 * não serve para ordenar (ex.: uma edição antiga que equivale ao vol. 1). Usado no cadastro manual e
 * no painel de admin.
 */
export function SeriesFields({ series, position, onSeriesChange, onPositionChange }: SeriesFieldsProps) {
  // Se a consulta falhar, o campo continua aceitando texto livre, só sem sugestões.
  const { data } = useQuery({ queryKey: ['series-titles'], queryFn: fetchSeriesTitles })
  const positionInvalid = !isSeriesPositionInputValid(position)

  // Um campo por linha: nomes de série são longos e cortavam em meia coluna.
  return (
    <>
      <Autocomplete
        freeSolo
        fullWidth
        options={data ?? []}
        inputValue={series}
        onInputChange={(_event, newValue) => onSeriesChange(newValue)}
        renderInput={(params) => <TextField {...params} label="Série" placeholder="Ex.: Homem-Aranha 2099" />}
      />
      <TextField
        label="Nº na série"
        fullWidth
        disabled={!series.trim()}
        value={position}
        onChange={(event) => onPositionChange(event.target.value)}
        error={positionInvalid}
        helperText={positionInvalid ? 'Use um número inteiro, ex.: 1.' : 'Vazio: usa o volume.'}
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
      />
    </>
  )
}
