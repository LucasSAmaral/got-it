import { TextField } from '@mui/material'

/** Mesmo limite da coluna `editions.synopsis` (check no banco). */
export const SYNOPSIS_MAX_LENGTH = 1500

/**
 * Sinopse opcional da edição (cadastro de edição nova e painel de admin). A dica pede texto próprio e sem
 * final: a sinopse da editora tem direito autoral, e o detalhe serve para quem ainda não leu.
 */
export function SynopsisField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label="Sinopse (opcional)"
      fullWidth
      multiline
      minRows={3}
      maxRows={10}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{ htmlInput: { maxLength: SYNOPSIS_MAX_LENGTH } }}
      helperText={`Do que trata a história, com as suas palavras e sem contar o final. ${value.length}/${SYNOPSIS_MAX_LENGTH}`}
    />
  )
}
