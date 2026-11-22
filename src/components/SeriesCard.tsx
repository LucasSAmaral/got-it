import { Stack } from '@mui/material'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CoverThumb } from './CoverThumb'
import { CardFrame, CardLink, ClampedTitle } from './EditionCard.styles'
import { SpeechBalloon } from './SpeechBalloon'

type SeriesCardProps = {
  workId: string
  title: string
  coverUrl: string | null
  /** A série terminou: balão "Completa" embaixo do nome. */
  completed: boolean
  /** As linhas embaixo do nome (progresso, média, leitura), cada tela escolhe as suas. */
  children: ReactNode
}

/** Cartão de uma série, que abre a página dela. Na listagem de séries e na coleção em ordem "Série". */
export function SeriesCard({ workId, title, coverUrl, completed, children }: SeriesCardProps) {
  return (
    <CardFrame variant="outlined">
      <CardLink component={Link} to={`/serie/${workId}`}>
        <CoverThumb coverUrl={coverUrl} title={title} />
        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
          <ClampedTitle variant="h4">{title}</ClampedTitle>
          {completed && <SpeechBalloon tone="success">Completa</SpeechBalloon>}
          {children}
        </Stack>
      </CardLink>
    </CardFrame>
  )
}
