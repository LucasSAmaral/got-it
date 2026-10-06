import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import { Alert, Box, Chip, IconButton, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { groupSeries, seriesProgress, titleWithinSeries, type SeriesStatus } from '../../lib/series'
import type { CollectionItem } from '../../types/catalog'
import { NetworkError } from '../collection/api'
import { useCollection } from '../collection/useCollection'
import { fetchSeries, type Series } from './api'
import { SlotTitle } from './SeriesPage.styles'

const STATUS_CHIP: Record<SeriesStatus, { label: string; color: 'success' | 'default' | 'warning' }> = {
  owned: { label: 'Tenho', color: 'success' },
  other_edition: { label: 'Outra edição', color: 'default' },
  missing: { label: 'Não tenho', color: 'warning' },
}

/** Sem sinal: só os seus exemplares desta série, a partir da lista completa (que cai para a cópia do aparelho). */
function seriesFromCollection(items: CollectionItem[], workId: string): Series | null {
  const mine = items.filter((item) => item.work_id === workId)
  if (mine.length === 0) return null
  // Dois exemplares da mesma edição viram um cartão só.
  const editions = mine.filter((item, index) => mine.findIndex((other) => other.edition_id === item.edition_id) === index)
  return {
    title: mine[0]!.series_title ?? '',
    editions: editions.map((item) => ({
      id: item.edition_id,
      title: item.title,
      publisher: item.publisher,
      volume: item.volume,
      isbn13: item.isbn13,
      cover_url: item.cover_url,
      series_position: item.series_position ?? null,
      myCopyId: item.copy_id,
    })),
  }
}

/**
 * Todas as edições do catálogo de uma série, agrupadas pela posição e marcadas "tenho", "outra edição"
 * ou "não tenho". Sem sinal, mostra só as suas.
 */
export function SeriesPage() {
  const { workId } = useParams<{ workId: string }>()
  const navigate = useNavigate()
  const offline = !navigator.onLine
  const seriesQuery = useQuery({
    queryKey: ['series', workId],
    queryFn: () => fetchSeries(workId!),
    enabled: !offline,
    retry: false,
  })
  // Já carregada pelo AppLayout; aqui só serve quando o servidor não responde.
  const collection = useCollection('')

  const fromDevice = offline || seriesQuery.error instanceof NetworkError
  const series = fromDevice ? seriesFromCollection(collection.data?.items ?? [], workId!) : seriesQuery.data
  const loading = fromDevice ? collection.isLoading : seriesQuery.isLoading
  const slots = series ? groupSeries(series.editions.map((edition) => ({ ...edition, owned: edition.myCopyId !== null }))) : []
  const progress = seriesProgress(slots)

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <IconButton aria-label="Voltar" onClick={() => navigate(-1)} edge="start" sx={{ display: { md: 'none' }, mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>

      {loading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {seriesQuery.isError && !fromDevice && <Alert severity="error">Não deu para abrir a série agora.</Alert>}

      {!loading && series === null && (
        <Alert severity="info">
          {fromDevice ? 'Sem conexão, e nenhum exemplar seu desta série está salvo no aparelho.' : 'Essa série não existe mais.'}
        </Alert>
      )}

      {series && (
        <>
          <Typography variant="h2">{series.title}</Typography>
          {fromDevice ? (
            <Alert severity="info" icon={<CloudOffOutlinedIcon fontSize="small" />} sx={{ mt: 2 }}>
              Sem conexão: mostrando só as edições que você tem. As que faltam aparecem quando a internet voltar.
            </Alert>
          ) : (
            progress.total > 0 && (
              <Typography variant="caption" color="text.secondary">
                Você tem {progress.covered} de {progress.total} número{progress.total === 1 ? '' : 's'} cadastrado
                {progress.total === 1 ? '' : 's'} no catálogo
              </Typography>
            )
          )}

          {slots.map((slot) => (
            <section key={slot.position ?? 'sem-numero'}>
              <SlotTitle variant="overline">{slot.position === null ? 'Sem número' : `Nº ${slot.position}`}</SlotTitle>
              <EditionGrid>
                {slot.items.map(({ edition, status }) => (
                  <EditionCard
                    key={edition.id}
                    edition={{ ...edition, title: titleWithinSeries(edition.title, series.title) }}
                    to={edition.myCopyId ? `/exemplar/${edition.myCopyId}` : undefined}
                    action={
                      <Chip
                        size="small"
                        label={STATUS_CHIP[status].label}
                        color={STATUS_CHIP[status].color}
                        variant={status === 'owned' ? 'filled' : 'outlined'}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    }
                  />
                ))}
              </EditionGrid>
            </section>
          ))}
        </>
      )}
    </Box>
  )
}
