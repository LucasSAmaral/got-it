import { Typography } from '@mui/material'
import { SeriesCard } from '../../components/SeriesCard'
import type { CollectionSeriesStats, ReadFilter } from '../../lib/collectionView'
import { seriesProgressText, type SeriesSummary } from '../../lib/series'

const count = (value: number, singular: string, plural: string) => `${value} ${value === 1 ? singular : plural}`

/** A linha de leitura acompanha o filtro: com "Não lidos", o que interessa é quantos faltam ler. */
function readLine({ read, unread }: CollectionSeriesStats, filter: ReadFilter) {
  if (filter === 'nao-lidos') return count(unread, 'não lido', 'não lidos')
  if (filter === 'lidos') return count(read, 'lido', 'lidos')
  return unread === 0 ? 'Todos lidos' : `${read} de ${read + unread} lidos`
}

type CollectionSeriesCardProps = {
  workId: string
  title: string
  stats: CollectionSeriesStats
  /** Resumo do catálogo (listagem de séries): total da série e se terminou. Sem ele, conta só os seus. */
  catalog: SeriesSummary | undefined
  readFilter: ReadFilter
}

/** Uma série na coleção em ordem "Série": abre a página da série, com o que você tem e o que falta. */
export function CollectionSeriesCard({ workId, title, stats, catalog, readFilter }: CollectionSeriesCardProps) {
  return (
    <SeriesCard
      workId={workId}
      title={title}
      // A capa é a sua (a do primeiro número que você tem), não a do catálogo.
      coverUrl={stats.summary.coverUrl}
      completed={catalog?.completed ?? false}
    >
      <Typography variant="body2" color="text.secondary" noWrap>
        {catalog ? seriesProgressText(catalog, false) : seriesProgressText(stats.summary, true)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {readLine(stats, readFilter)}
      </Typography>
    </SeriesCard>
  )
}
