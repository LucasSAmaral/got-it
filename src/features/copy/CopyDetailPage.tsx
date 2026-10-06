import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Alert, Box, IconButton, Link, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatDate, formatPrice, titleInitials } from '../../lib/format'
import { seriesPosition } from '../../lib/series'
import { tokens } from '../../theme'
import { fetchCopyDetail, type CopyDetail } from './api'
import { CoverFrame, DetailList, SectionCard, SectionTitle } from './CopyDetailPage.styles'
import { EditCopyDialog } from './EditCopyDialog'

/** `to`: o valor vira link (ex.: a série abre a página dela). */
type Detail = { label: string; value: string | null; mono?: boolean; to?: string }

function Details({ items }: { items: Detail[] }) {
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
function seriesLabel(edition: CopyDetail['edition']): string | null {
  if (!edition.work) return null
  const position = seriesPosition(edition)
  return position === null ? edition.work.title : `${edition.work.title} · nº ${position}`
}

/** Detalhe de um exemplar da coleção: capa grande no topo e, abaixo, os dados da edição e do exemplar. */
export function CopyDetailPage() {
  const { copyId } = useParams<{ copyId: string }>()
  const navigate = useNavigate()
  const [coverFailed, setCoverFailed] = useState(false)
  const [editing, setEditing] = useState(false)

  const offline = !navigator.onLine
  const { data, isLoading, isError } = useQuery({
    queryKey: ['copy-detail', copyId],
    queryFn: () => fetchCopyDetail(copyId!),
    enabled: !offline,
    retry: false,
  })

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 }, maxWidth: { md: 720 } }}>
      <IconButton aria-label="Voltar" onClick={() => navigate(-1)} edge="start" sx={{ display: { md: 'none' }, mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {/* Capa e detalhes não ficam salvos no aparelho: só a lista e o "Eu tenho?" funcionam sem sinal. */}
      {(offline || isError) && (
        <Alert severity="info">
          Não deu para abrir os detalhes agora. Sem conexão, a lista da coleção e o "Eu tenho?" continuam funcionando.
        </Alert>
      )}

      {data === null && <Alert severity="warning">Esse exemplar não está mais na sua coleção.</Alert>}

      {data && (
        <>
          <CoverFrame>
            {data.edition.cover_url && !coverFailed ? (
              <Box
                component="img"
                src={data.edition.cover_url}
                alt={`Capa de ${data.edition.title}`}
                onError={() => setCoverFailed(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Typography variant="h1" color="text.secondary">
                {titleInitials(data.edition.title)}
              </Typography>
            )}
          </CoverFrame>

          <Stack spacing={0.5} sx={{ mt: 3 }}>
            <Typography variant="h2">{data.edition.title}</Typography>
            <Typography variant="body1" color="text.secondary">
              {[data.edition.publisher, data.edition.volume].filter(Boolean).join(' · ') || 'Editora não informada'}
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <SectionCard variant="outlined">
              <SectionTitle variant="overline">Edição</SectionTitle>
              <Details
                items={[
                  {
                    label: 'Série',
                    value: seriesLabel(data.edition),
                    to: data.edition.work_id ? `/serie/${data.edition.work_id}` : undefined,
                  },
                  { label: 'Editora', value: data.edition.publisher },
                  { label: 'Volume / nº', value: data.edition.volume },
                  { label: 'Formato', value: data.edition.format },
                  { label: 'Ano', value: data.edition.year ? String(data.edition.year) : null },
                  { label: 'ISBN', value: data.edition.isbn13, mono: true },
                ]}
              />
            </SectionCard>
            <SectionCard variant="outlined">
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <SectionTitle variant="overline">Seu exemplar</SectionTitle>
                <IconButton
                  aria-label="Editar exemplar"
                  size="small"
                  onClick={() => setEditing(true)}
                  sx={{ mt: -0.75, mr: -0.75, color: 'text.secondary' }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Details
                items={[
                  { label: 'Condição', value: data.condition },
                  { label: 'Adquirido em', value: data.acquired_at ? formatDate(data.acquired_at) : null },
                  { label: 'Preço pago', value: data.price_paid !== null ? formatPrice(data.price_paid) : null },
                ]}
              />
            </SectionCard>
          </Stack>

          {editing && <EditCopyDialog copy={data} onClose={() => setEditing(false)} />}
        </>
      )}
    </Box>
  )
}
