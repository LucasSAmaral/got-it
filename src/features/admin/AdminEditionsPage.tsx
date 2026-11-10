import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import { Alert, Box, Button, IconButton, Stack, Typography, useMediaQuery, type Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { ListPagination } from '../../components/ListPagination'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SearchField } from '../../components/SearchField'
import { useShowMore } from '../../hooks/useShowMore'
import { paginate, parsePage } from '../../lib/pagination'
import { fetchModerationCount } from '../moderation/api'
import { fetchStores } from '../store/api'
import { isAdmin } from './admin'
import type { EditionSummary } from './api'
import { EditEditionDialog } from './EditEditionDialog'
import { useAdminEditions } from './useAdminEditions'

/**
 * Busca e edita qualquer edição do catálogo — sem precisar mexer direto no Supabase. Como na coleção:
 * em tela larga, páginas de 12 com a página na URL; no celular, mais ao rolar.
 */
export function AdminEditionsPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useAdminEditions(query)
  const [editing, setEditing] = useState<EditionSummary | null>(null)
  const isWide = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'), { noSsr: true })
  const [searchParams, setSearchParams] = useSearchParams()
  const { pageItems, page, pageCount } = paginate(data ?? [], parsePage(searchParams.get('pagina')))
  const { visibleCount, hasMore, sentinelRef } = useShowMore(data?.length ?? 0, query.trim())
  const visibleEditions = isWide ? pageItems : (data ?? []).slice(0, visibleCount)
  const topRef = useRef<HTMLDivElement>(null)
  // Se falhar, só o atalho das chegadas some; a edição do catálogo continua.
  const { data: stores } = useQuery({ queryKey: ['stores'], queryFn: fetchStores })
  const { data: pendingReview } = useQuery({ queryKey: ['moderation', 'count'], queryFn: fetchModerationCount })

  const changePage = (newPage: number) => {
    setSearchParams(newPage === 1 ? {} : { pagina: String(newPage) })
    topRef.current?.scrollIntoView()
  }

  // Busca nova começa na primeira página.
  const changeQuery = (newQuery: string) => {
    setQuery(newQuery)
    if (searchParams.has('pagina')) setSearchParams({}, { replace: true })
  }

  if (!isAdmin(session)) {
    return <Navigate to="/" replace />
  }

  return (
    <Box ref={topRef} sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Typography variant="h2" sx={{ mb: 2.5 }}>
        Editar catálogo
      </Typography>

      {/* O Stack põe os botões numa linha própria: sozinhos eles são inline e ficam colados na busca. */}
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', mb: 2.5 }}>
        <Button
          component={Link}
          to="/admin/revisao"
          variant="outlined"
          color="inherit"
          startIcon={<FlagOutlinedIcon />}
        >
          Revisar{pendingReview ? ` (${pendingReview})` : ''}
        </Button>
        {stores && stores.length > 0 && (
          <Button
            component={Link}
            to="/admin/chegadas"
            variant="outlined"
            color="inherit"
            startIcon={<StorefrontOutlinedIcon />}
          >
            Chegou nas lojas
          </Button>
        )}
      </Stack>

      <SearchField placeholder="Buscar por título, editora ou ISBN" value={query} onChange={changeQuery} />

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>}

      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nenhuma edição encontrada.
        </Typography>
      )}

      <EditionGrid>
        {visibleEditions.map((edition) => (
          <EditionCard
            key={edition.id}
            edition={edition}
            action={
              <IconButton
                aria-label={`Editar "${edition.title}"`}
                size="small"
                onClick={() => setEditing(edition)}
                sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            }
          />
        ))}
      </EditionGrid>
      {!isWide && hasMore && <Box ref={sentinelRef} />}
      {isWide && pageCount > 1 && <ListPagination count={pageCount} page={page} onChange={changePage} />}

      <EditEditionDialog edition={editing} onClose={() => setEditing(null)} />
    </Box>
  )
}
