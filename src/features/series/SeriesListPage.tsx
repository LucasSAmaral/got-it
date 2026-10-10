import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CoverThumb } from '../../components/CoverThumb'
import { CardFrame, CardLink, ClampedTitle } from '../../components/EditionCard.styles'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useShowMore } from '../../hooks/useShowMore'
import { seriesSummariesFromCollection, type SeriesSummary } from '../../lib/series'
import { NetworkError } from '../collection/api'
import { useCollection } from '../collection/useCollection'
import { fetchSeriesList } from './api'

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** "Você tem N de M" quando a série tem números; sem sinal só dá para contar os seus. */
function progressLabel(series: SeriesSummary, fromDevice: boolean) {
  if (fromDevice) {
    return series.total > 0
      ? `Você tem ${plural(series.covered, 'número', 'números')}`
      : `Você tem ${plural(series.editionCount, 'edição', 'edições')}`
  }
  return series.total > 0
    ? `Você tem ${series.covered} de ${plural(series.total, 'número', 'números')}`
    : plural(series.editionCount, 'edição sem número', 'edições sem número')
}

function SeriesCard({ series, fromDevice }: { series: SeriesSummary; fromDevice: boolean }) {
  return (
    <CardFrame variant="outlined">
      <CardLink component={Link} to={`/serie/${series.id}`}>
        <CoverThumb coverUrl={series.coverUrl} title={series.title} />
        <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
          <ClampedTitle variant="h4">{series.title}</ClampedTitle>
          <Typography variant="body2" color="text.secondary" noWrap>
            {progressLabel(series, fromDevice)}
          </Typography>
        </Stack>
      </CardLink>
    </CardFrame>
  )
}

/**
 * Todas as séries do catálogo, com "você tem N de M", e o filtro "Que sigo" (séries em que você tem
 * algum exemplar). O filtro fica na URL para continuar escolhido ao voltar da página da série. Sem
 * sinal, mostra só as suas, a partir da lista completa da coleção (que cai para a cópia do aparelho).
 */
export function SeriesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const onlyFollowing = searchParams.get('filtro') === 'sigo'
  const offline = !navigator.onLine
  const listQuery = useQuery({ queryKey: ['series-list'], queryFn: fetchSeriesList, enabled: !offline, retry: false })
  // Já carregada pelo AppLayout; aqui só serve quando o servidor não responde.
  const collection = useCollection('')
  const collectionItems = collection.data?.items
  const fromCollection = useMemo(
    () => (collectionItems ? seriesSummariesFromCollection(collectionItems) : undefined),
    [collectionItems],
  )

  const fromDevice = offline || listQuery.error instanceof NetworkError
  const all = fromDevice ? fromCollection : listQuery.data
  const loading = fromDevice ? collection.isLoading : listQuery.isLoading
  const shown = onlyFollowing && !fromDevice ? all?.filter((series) => series.following) : all
  const { visibleCount, hasMore, sentinelRef } = useShowMore(shown?.length ?? 0, String(onlyFollowing))

  const setFilter = (following: boolean) => setSearchParams(following ? { filtro: 'sigo' } : {}, { replace: true })

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h2">Séries</Typography>
        <Typography variant="caption" color="text.secondary">
          {shown ? plural(shown.length, 'série', 'séries') : ' '}
        </Typography>
      </Stack>

      {fromDevice ? (
        <Alert severity="info" icon={<CloudOffOutlinedIcon fontSize="small" />} sx={{ mb: 2 }}>
          Sem conexão: mostrando só as séries em que você tem exemplar. As outras aparecem quando a internet voltar.
        </Alert>
      ) : (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label="Todas" color={onlyFollowing ? 'default' : 'primary'} onClick={() => setFilter(false)} />
          <Chip label="Que sigo" color={onlyFollowing ? 'primary' : 'default'} onClick={() => setFilter(true)} />
        </Stack>
      )}

      {loading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {listQuery.isError && !fromDevice && <Alert severity="error">Não deu para carregar as séries agora.</Alert>}

      {shown && shown.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {onlyFollowing || fromDevice
            ? 'Você ainda não tem exemplar de nenhuma série. A série de uma edição é escolhida no cadastro.'
            : 'Nenhuma série no catálogo ainda.'}
        </Typography>
      )}

      <EditionGrid>
        {shown?.slice(0, visibleCount).map((series) => (
          <SeriesCard key={series.id} series={series} fromDevice={fromDevice} />
        ))}
      </EditionGrid>
      {hasMore && <Box ref={sentinelRef} />}
    </Box>
  )
}
