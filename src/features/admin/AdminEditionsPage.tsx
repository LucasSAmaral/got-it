import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SearchField } from '../../components/SearchField'
import { useShowMore } from '../../hooks/useShowMore'
import { fetchModerationCount } from '../moderation/api'
import { fetchStores } from '../store/api'
import { isAdmin } from './admin'
import type { EditionSummary } from './api'
import { EditEditionDialog } from './EditEditionDialog'
import { useAdminEditions } from './useAdminEditions'

/** Busca e edita qualquer edição do catálogo — sem precisar mexer direto no Supabase. */
export function AdminEditionsPage() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useAdminEditions(query)
  const [editing, setEditing] = useState<EditionSummary | null>(null)
  const { visibleCount, hasMore, sentinelRef } = useShowMore(data?.length ?? 0, query.trim())
  // Se falhar, só o atalho das chegadas some; a edição do catálogo continua.
  const { data: stores } = useQuery({ queryKey: ['stores'], queryFn: fetchStores })
  const { data: pendingReview } = useQuery({ queryKey: ['moderation', 'count'], queryFn: fetchModerationCount })

  if (!isAdmin(session)) {
    return <Navigate to="/" replace />
  }

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
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

      <SearchField placeholder="Buscar por título, editora ou ISBN" value={query} onChange={setQuery} />

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>}

      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nenhuma edição encontrada.
        </Typography>
      )}

      <EditionGrid>
        {data?.slice(0, visibleCount).map((edition) => (
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
      {hasMore && <Box ref={sentinelRef} />}

      <EditEditionDialog edition={editing} onClose={() => setEditing(null)} />
    </Box>
  )
}
