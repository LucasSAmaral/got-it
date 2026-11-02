import StarIcon from '@mui/icons-material/Star'
import { Stack, Typography, type TypographyProps } from '@mui/material'
import { ratingShort, ratingSummary, type RatingStats } from '../../lib/format'
import { tokens } from '../../theme'

/**
 * Estrela dourada + média da comunidade: "★ 4,3 · 18 avaliações" (`short`: "★ 4,3 (18)", no cartão da edição).
 * Sem `stats` (ninguém avaliou, ou a consulta falhou) não mostra nada.
 */
export function RatingBadge({
  stats,
  short = false,
  variant = 'body2',
}: {
  stats: RatingStats | undefined
  short?: boolean
  variant?: TypographyProps['variant']
}) {
  if (!stats) return null
  const text = short ? ratingShort(stats) : ratingSummary(stats)
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <StarIcon sx={{ fontSize: 16, color: tokens.color.gold }} aria-hidden />
      <Typography variant={variant} color="text.secondary" noWrap aria-label={`Média ${text}`}>
        {text}
      </Typography>
    </Stack>
  )
}
