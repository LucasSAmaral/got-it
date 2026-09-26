import { Box, Card, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { titleInitials } from '../lib/format'
import { tokens } from '../theme'
import type { Edition } from '../types/catalog'
import { CardBody, CardLink, ClampedTitle, CoverPlaceholder } from './EditionCard.styles'

type EditionCardProps = {
  edition: Pick<Edition, 'title' | 'publisher' | 'volume' | 'isbn13' | 'cover_url'>
  /** Botão no canto superior direito (ex.: excluir na coleção, editar no admin). */
  action?: ReactNode
  /** Rota aberta ao tocar na capa ou no texto. O `action` fica fora do link: botão dentro de link não é HTML válido. */
  to?: string
}

/** Cartão de uma edição: capa, título, editora · volume e ISBN. Usado na coleção e no painel de admin. */
export function EditionCard({ edition, action, to }: EditionCardProps) {
  const [coverFailed, setCoverFailed] = useState(false)

  const content = (
    <>
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
            {titleInitials(edition.title)}
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
    </>
  )

  return (
    <Card variant="outlined" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1.5, borderColor: 'divider' }}>
      {to ? (
        <CardLink component={Link} to={to}>
          {content}
        </CardLink>
      ) : (
        <CardBody>{content}</CardBody>
      )}

      {action}
    </Card>
  )
}
