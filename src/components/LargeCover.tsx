import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import { titleInitials } from '../lib/format'
import { CoverFrame } from './LargeCover.styles'

type LargeCoverProps = {
  coverUrl: string | null
  title: string
  /** Largura máxima em px: 280 no detalhe do exemplar, menor dentro de um diálogo. */
  maxWidth?: number
}

/** Capa grande (detalhe do exemplar, diálogo das chegadas): a imagem quando existe e carrega, senão as iniciais. */
export function LargeCover({ coverUrl, title, maxWidth = 280 }: LargeCoverProps) {
  const [coverFailed, setCoverFailed] = useState(false)

  return (
    <CoverFrame sx={{ maxWidth }}>
      {coverUrl && !coverFailed ? (
        <Box
          component="img"
          src={coverUrl}
          alt={`Capa de ${title}`}
          onError={() => setCoverFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Typography variant="h1" color="text.secondary">
          {titleInitials(title)}
        </Typography>
      )}
    </CoverFrame>
  )
}
