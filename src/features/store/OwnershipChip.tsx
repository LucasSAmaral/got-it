import { Chip } from '@mui/material'

/** "Tenho" / "Falta esse" nos cartões das chegadas (vitrine e Início). */
export function OwnershipChip({ has }: { has: boolean }) {
  return (
    <Chip
      size="small"
      label={has ? 'Tenho' : 'Falta esse'}
      color={has ? 'success' : 'warning'}
      variant={has ? 'filled' : 'outlined'}
    />
  )
}
