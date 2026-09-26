import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Alert, Box, IconButton, Typography } from '@mui/material'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { EditionCard } from '../../components/EditionCard'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SearchField } from '../../components/SearchField'
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

  if (!isAdmin(session)) {
    return <Navigate to="/" replace />
  }

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Typography variant="h2" sx={{ mb: 2.5 }}>
        Editar catálogo
      </Typography>

      <SearchField placeholder="Buscar por título, editora ou ISBN" value={query} onChange={setQuery} />

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>}

      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nenhuma edição encontrada.
        </Typography>
      )}

      <EditionGrid>
        {data?.map((edition) => (
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

      <EditEditionDialog edition={editing} onClose={() => setEditing(null)} />
    </Box>
  )
}
