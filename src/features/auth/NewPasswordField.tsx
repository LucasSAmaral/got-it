import { TextField } from '@mui/material'
import { MIN_PASSWORD_LENGTH } from '../../lib/auth'

interface NewPasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

/** Senha que está sendo criada (cadastro ou senha nova), com o mínimo do Supabase avisado embaixo. */
export function NewPasswordField({ label, value, onChange, disabled }: NewPasswordFieldProps) {
  return (
    <TextField
      id="password"
      label={label}
      type="password"
      autoComplete="new-password"
      required
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      error={value.length > 0 && value.length < MIN_PASSWORD_LENGTH}
      helperText={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`}
    />
  )
}
