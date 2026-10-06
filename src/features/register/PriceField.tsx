import { TextField } from '@mui/material'
import { isPriceInputValid } from '../../lib/format'

type PriceFieldProps = {
  value: string
  onChange: (value: string) => void
}

/**
 * Preço pago, aceitando "39,90", "R$ 39,90" ou "1.234,50". Avisa na hora quando o texto não é um preço,
 * em vez de salvar vazio sem dizer nada. Usado no cadastro e na edição do exemplar.
 */
export function PriceField({ value, onChange }: PriceFieldProps) {
  const invalid = !isPriceInputValid(value)

  return (
    <TextField
      label="Preço pago"
      placeholder="R$ 0,00"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={invalid}
      helperText={invalid ? 'Use um valor como 39,90.' : undefined}
      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
    />
  )
}
