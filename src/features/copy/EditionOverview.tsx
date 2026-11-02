import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import { Button, Link, Stack, Typography } from '@mui/material'
import { Fragment, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { LargeCover } from '../../components/LargeCover'
import { NarrationTitle } from '../../components/NarrationTitle'
import { seriesPosition } from '../../lib/series'
import { tokens } from '../../theme'
import { ReportEditionDialog } from '../moderation/ReportEditionDialog'
import { RatingSection } from '../ratings/RatingSection'
import type { EditionInfo } from './api'
import { DetailList, SectionCard } from './DetailPage.styles'

/** `to`: o valor vira link (ex.: a série abre a página dela). */
export type Detail = { label: string; value: string | null; mono?: boolean; to?: string }

/** Lista rótulo → valor ("Editora", "ISBN"…), com "—" no que está vazio. */
export function Details({ items }: { items: Detail[] }) {
  return (
    <DetailList component="dl">
      {items.map((item) => (
        <Fragment key={item.label}>
          <Typography component="dt" variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography
            component="dd"
            variant="body2"
            sx={{ fontWeight: 600, fontFamily: item.mono && item.value ? tokens.font.mono : undefined }}
          >
            {item.value && item.to ? (
              <Link component={RouterLink} to={item.to}>
                {item.value}
              </Link>
            ) : (
              (item.value ?? '—')
            )}
          </Typography>
        </Fragment>
      ))}
    </DetailList>
  )
}

/** "Homem-Aranha 2099 · nº 1"; o nº vem do "Nº na série" ou, sem ele, do volume. */
function seriesLabel(edition: EditionInfo): string | null {
  if (!edition.work) return null
  const position = seriesPosition(edition)
  return position === null ? edition.work.title : `${edition.work.title} · nº ${position}`
}

/** Aviso embaixo da capa vazia sobre a capa que a pessoa enviou: na fila, ou recusada. */
function coverReviewNote(submissions: EditionInfo['cover_submissions']): string | null {
  if (submissions.some((submission) => submission.status === 'pending')) {
    return 'Capa enviada, em análise. Aparece aqui depois de revisada.'
  }
  if (submissions.some((submission) => submission.status === 'rejected')) {
    return 'A capa que você enviou não foi aprovada.'
  }
  return null
}

/**
 * O que o detalhe do exemplar e o da edição têm em comum: capa grande, título, editora · volume e o quadro
 * "Edição" (com a denúncia) e a "Avaliação". Cada página põe embaixo o próprio quadro ("Seu exemplar" ou "Na sua coleção").
 */
export function EditionOverview({ edition }: { edition: EditionInfo }) {
  const [reporting, setReporting] = useState(false)
  const note = edition.cover_url ? null : coverReviewNote(edition.cover_submissions)

  return (
    <>
      <LargeCover coverUrl={edition.cover_url} title={edition.title} />
      {note && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
          {note}
        </Typography>
      )}

      <Stack spacing={0.5} sx={{ mt: 3 }}>
        <Typography variant="h2">{edition.title}</Typography>
        <Typography variant="body1" color="text.secondary">
          {[edition.publisher, edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
        </Typography>
      </Stack>

      <SectionCard variant="outlined" sx={{ mt: 3 }}>
        <NarrationTitle sx={{ mb: 1.5 }}>Edição</NarrationTitle>
        <Details
          items={[
            {
              label: 'Série',
              value: seriesLabel(edition),
              to: edition.work_id ? `/serie/${edition.work_id}` : undefined,
            },
            { label: 'Editora', value: edition.publisher },
            { label: 'Volume / nº', value: edition.volume },
            { label: 'Formato', value: edition.format },
            { label: 'Ano', value: edition.year ? String(edition.year) : null },
            { label: 'ISBN', value: edition.isbn13, mono: true },
          ]}
        />
        {/* O catálogo é compartilhado: capa ou dado errado de outra pessoa vai para a revisão do admin. */}
        <Button
          size="small"
          color="inherit"
          startIcon={<FlagOutlinedIcon fontSize="small" />}
          onClick={() => setReporting(true)}
          sx={{ mt: 1.5, color: 'text.secondary' }}
        >
          Denunciar capa ou dado errado
        </Button>
      </SectionCard>

      <RatingSection editionId={edition.id} />

      {reporting && (
        <ReportEditionDialog editionId={edition.id} title={edition.title} onClose={() => setReporting(false)} />
      )}
    </>
  )
}
