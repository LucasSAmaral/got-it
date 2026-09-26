import { Box, Card, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { tokens } from '../theme'
import type { Edition } from '../types/catalog'
import { ClampedTitle, CoverPlaceholder } from './EditionCard.styles'

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== '—')
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

type EditionCardProps = {
  edition: Pick<Edition, 'title' | 'publisher' | 'volume' | 'isbn13' | 'cover_url'>
  /** Botão no canto superior direito (ex.: excluir na coleção, editar no admin). */
  action?: ReactNode
}

/** Cartão de uma edição: capa, título, editora · volume e ISBN. Usado na coleção e no painel de admin. */
export function EditionCard({ edition, action }: EditionCardProps) {
  const [coverFailed, setCoverFailed] = useState(false)

  return (
    <Card variant="outlined" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1.5, borderColor: 'divider' }}>
      <CoverPlaceholder>
        {edition.cover_url && !coverFailed ? (
          <Box
            component="img"
            src={edition.cover_url}
            alt=""
            onError={() => setCoverFailed(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography variant="h4" color="text.secondary" sx={{ fontSize: 16 }}>
            {initials(edition.title)}
          </Typography>
        )}
      </CoverPlaceholder>
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        {/* Celular: uma linha com reticências. Tela larga: até duas linhas, porque o título é o que identifica a edição. */}
        <ClampedTitle variant="h4">{edition.title}</ClampedTitle>
        <Typography variant="body2" color="text.secondary" noWrap>
          {[edition.publisher, edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
        </Typography>
        {edition.isbn13 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: tokens.font.mono, mt: 0.25 }}
          >
            {edition.isbn13}
          </Typography>
        )}
      </Stack>

      {action}
    </Card>
  )
}
