import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import { titleInitials } from '../lib/format'
import { CoverPlaceholder } from './EditionCard.styles'

/** Miniatura da capa nos cartões: a imagem quando existe e carrega, senão as iniciais do título. */
export function CoverThumb({ coverUrl, title }: { coverUrl: string | null; title: string }) {
  const [coverFailed, setCoverFailed] = useState(false)

  return (
    <CoverPlaceholder>
      {coverUrl && !coverFailed ? (
        <Box
          component="img"
          src={coverUrl}
          alt=""
          // Lista grande: só baixa as capas perto da área visível. O contêiner tem tamanho fixo, então nada pula ao carregar.
          loading="lazy"
          onError={() => setCoverFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Typography variant="h4" color="text.secondary" sx={{ fontSize: 16 }}>
          {titleInitials(title)}
        </Typography>
      )}
    </CoverPlaceholder>
  )
}
