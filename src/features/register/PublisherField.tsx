import { Autocomplete, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { rankPublishers } from '../../lib/publishers'
import { fetchCatalogPublishers } from './api'
import { COMMON_PUBLISHERS } from './constants'

type PublisherFieldProps = {
  value: string
  onChange: (value: string) => void
}

/**
 * Editora com sugestões (as do catálogo, mais usadas primeiro), mas aceitando texto livre para uma
 * editora nova. O texto digitado é o valor: não precisa escolher da lista nem apertar Enter.
 * Usado no cadastro manual e na edição pelo painel de admin.
 */
export function PublisherField({ value, onChange }: PublisherFieldProps) {
  // Se a consulta falhar, as sugestões ficam só com as editoras comuns — o campo continua funcionando.
  const { data } = useQuery({ queryKey: ['catalog-publishers'], queryFn: fetchCatalogPublishers })
  const options = useMemo(() => rankPublishers(data ?? [], COMMON_PUBLISHERS), [data])

  return (
    <Autocomplete
      freeSolo
      fullWidth
      options={options}
      inputValue={value}
      onInputChange={(_event, newValue) => onChange(newValue)}
      renderInput={(params) => <TextField {...params} label="Editora" placeholder="Ex.: Panini" />}
    />
  )
}
