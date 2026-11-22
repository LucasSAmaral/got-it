import AddIcon from '@mui/icons-material/Add'
import { Alert, Box, Chip, MenuItem, Stack, TextField, Typography, useMediaQuery, type Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EditionGrid } from '../../components/EditionGrid'
import { ListPagination } from '../../components/ListPagination'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SearchField } from '../../components/SearchField'
import { useShowMore } from '../../hooks/useShowMore'
import {
  collectionEntries,
  collectionSeriesStats,
  filterByRead,
  parseOrder,
  parseReadFilter,
  sortCollection,
  withSeriesFrom,
  type CollectionEntry,
  type CollectionOrder,
  type CollectionSeriesStats,
  type ReadFilter,
} from '../../lib/collectionView'
import { paginate, parsePage } from '../../lib/pagination'
import { fetchSeriesList } from '../series/api'
import { CollectionItemCard } from './CollectionItemCard'
import { CollectionSeriesCard } from './CollectionSeriesCard'
import { AddFab, ReadChips, ViewControls } from './CollectionPage.styles'
import { OfflineNotice } from './OfflineNotice'
import { useCollection } from './useCollection'

const ORDER_LABELS: Record<CollectionOrder, string> = { recentes: 'Recentes', az: 'A–Z', serie: 'Série' }

const READ_LABELS: Record<ReadFilter, string> = { todos: 'Todos', 'nao-lidos': 'Não lidos', lidos: 'Lidos' }

function countLabel(count: number, filter: ReadFilter) {
  if (filter === 'lidos') return `${count} lido${count === 1 ? '' : 's'}`
  if (filter === 'nao-lidos') return `${count} não lido${count === 1 ? '' : 's'}`
  return `${count} exemplar${count === 1 ? '' : 'es'}`
}

function emptyLabel(searching: boolean, filter: ReadFilter, hasAny: boolean) {
  if (searching) return 'Nenhum exemplar encontrado.'
  if (!hasAny) return 'Sua coleção está vazia. Cadastre o primeiro exemplar.'
  return filter === 'lidos' ? 'Nenhum exemplar marcado como lido.' : 'Você já leu todos.'
}

export function CollectionPage() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useCollection(query)
  // A lista completa (já carregada pelo AppLayout) completa a série dos resultados da busca, que não a trazem.
  const fullList = useCollection('').data?.items
  const navigate = useNavigate()
  // A lista continua vindo inteira (é ela que alimenta a cópia offline); só o que aparece na tela é parcial.
  // Tela larga: páginas de 12, com a página na URL para continuar a mesma ao voltar do detalhe do exemplar.
  // Celular: mais itens ao rolar, que é o gesto natural ali. `noSsr` lê a largura já no primeiro render,
  // senão o desktop abriria um instante no modo celular.
  const isWide = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'), { noSsr: true })
  const [searchParams, setSearchParams] = useSearchParams()
  // Ordem e filtro de leitura ficam na URL, como a página, para continuarem ao voltar do detalhe do exemplar.
  const order = parseOrder(searchParams.get('ordem'))
  const readFilter = parseReadFilter(searchParams.get('leitura'))
  const received = data?.items
  const items = useMemo(() => {
    if (!received) return undefined
    const withSeries = order === 'serie' && fullList ? withSeriesFrom(received, fullList) : received
    return sortCollection(filterByRead(withSeries, readFilter), order)
  }, [received, fullList, order, readFilter])
  // Em "Série", um cartão por série (e os sem série soltos); nas outras ordens, um por exemplar. A paginação
  // conta cartões, então uma série nunca fica dividida entre duas páginas.
  const entries = useMemo<CollectionEntry[] | undefined>(
    () => (items && order === 'serie' ? collectionEntries(items) : items?.map((item) => ({ kind: 'copy', item }))),
    [items, order],
  )
  // O cartão da série conta todos os seus exemplares dela (não só os que passaram pela busca e pelo filtro).
  const seriesStats = useMemo(() => {
    const mine = fullList ?? received ?? []
    if (order !== 'serie') return new Map<string, CollectionSeriesStats | null>()
    const workIds = [...new Set(mine.flatMap((item) => (item.work_id ? [item.work_id] : [])))]
    return new Map(workIds.map((workId) => [workId, collectionSeriesStats(mine.filter((item) => item.work_id === workId))]))
  }, [fullList, received, order])
  // Total da série e "Completa" vêm do catálogo (a mesma consulta da listagem de séries, que fica em cache).
  // Sem sinal ou se falhar, o cartão conta só os seus.
  const catalogSeries = useQuery({
    queryKey: ['series-list'],
    queryFn: fetchSeriesList,
    enabled: order === 'serie' && navigator.onLine,
    retry: false,
  })
  const catalogById = useMemo(
    () => new Map((catalogSeries.data ?? []).map((series) => [series.id, series])),
    [catalogSeries.data],
  )
  const { pageItems, page, pageCount } = paginate(entries ?? [], parsePage(searchParams.get('pagina')))
  const { visibleCount, hasMore, sentinelRef } = useShowMore(entries?.length ?? 0, `${query.trim()}|${order}|${readFilter}`)
  const visibleEntries = isWide ? pageItems : (entries ?? []).slice(0, visibleCount)
  const topRef = useRef<HTMLDivElement>(null)

  // Monta a URL a partir da escolha atual; o padrão (recentes, todos, página 1) não aparece nela.
  const viewParams = (view: { order: CollectionOrder; readFilter: ReadFilter; page: number }) => ({
    ...(view.order !== 'recentes' && { ordem: view.order }),
    ...(view.readFilter !== 'todos' && { leitura: view.readFilter }),
    ...(view.page > 1 && { pagina: String(view.page) }),
  })

  const changePage = (newPage: number) => {
    setSearchParams(viewParams({ order, readFilter, page: newPage }))
    topRef.current?.scrollIntoView()
  }

  // Busca, ordem ou filtro novos começam na primeira página.
  const changeQuery = (newQuery: string) => {
    setQuery(newQuery)
    if (searchParams.has('pagina')) setSearchParams(viewParams({ order, readFilter, page: 1 }), { replace: true })
  }
  const changeOrder = (newOrder: CollectionOrder) =>
    setSearchParams(viewParams({ order: newOrder, readFilter, page: 1 }), { replace: true })
  const changeReadFilter = (newFilter: ReadFilter) =>
    setSearchParams(viewParams({ order, readFilter: newFilter, page: 1 }), { replace: true })

  const renderEntry = (entry: CollectionEntry) => {
    if (entry.kind === 'copy') {
      return <CollectionItemCard key={entry.item.copy_id} item={entry.item} showDelete={!data?.fromMirror} />
    }
    const stats = seriesStats.get(entry.workId)
    if (!stats) return null
    return (
      <CollectionSeriesCard
        key={entry.workId}
        workId={entry.workId}
        title={entry.title}
        stats={stats}
        catalog={catalogById.get(entry.workId)}
        readFilter={readFilter}
      />
    )
  }

  return (
    <Box ref={topRef} sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h2">Sua coleção</Typography>
        <Typography variant="caption" color="text.secondary">
          {items ? countLabel(items.length, readFilter) : ' '}
        </Typography>
      </Stack>

      {data?.fromMirror && <OfflineNotice savedAt={data.savedAt} />}

      <SearchField placeholder="Buscar por título, editora ou ISBN" value={query} onChange={changeQuery} />

      <ViewControls>
        <ReadChips>
          {(Object.keys(READ_LABELS) as ReadFilter[]).map((filter) => (
            <Chip
              key={filter}
              size="small"
              label={READ_LABELS[filter]}
              color={readFilter === filter ? 'primary' : 'default'}
              onClick={() => changeReadFilter(filter)}
            />
          ))}
        </ReadChips>
        <TextField
          select
          size="small"
          label="Ordem"
          value={order}
          onChange={(event) => changeOrder(parseOrder(event.target.value))}
          sx={{ minWidth: 120 }}
        >
          {(Object.keys(ORDER_LABELS) as CollectionOrder[]).map((option) => (
            <MenuItem key={option} value={option}>
              {ORDER_LABELS[option]}
            </MenuItem>
          ))}
        </TextField>
      </ViewControls>

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para carregar sua coleção agora.</Alert>}

      {items && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {emptyLabel(query.trim() !== '', readFilter, (received?.length ?? 0) > 0)}
        </Typography>
      )}

      <EditionGrid>{visibleEntries.map(renderEntry)}</EditionGrid>
      {!isWide && hasMore && <Box ref={sentinelRef} />}
      {isWide && pageCount > 1 && (
        <ListPagination count={pageCount} page={page} onChange={changePage} />
      )}

      <AddFab color="primary" aria-label="Cadastrar novo exemplar" onClick={() => navigate('/cadastro')}>
        <AddIcon />
      </AddFab>
    </Box>
  )
}
