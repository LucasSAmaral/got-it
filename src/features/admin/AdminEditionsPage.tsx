import { Alert, Box, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { isAdmin } from './admin'
import type { EditionSummary } from './api'
import { EditEditionDialog } from './EditEditionDialog'
import { SearchField } from '../collection/CollectionPage.styles'
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

      <SearchField
        fullWidth
        placeholder="Buscar por título, editora ou ISBN"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para consultar o catálogo agora.</Alert>}

      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nenhuma edição encontrada.
        </Typography>
      )}

      <List disablePadding>
        {data?.map((edition) => (
          <ListItemButton key={edition.id} onClick={() => setEditing(edition)} sx={{ borderRadius: 2, mb: 0.5 }}>
            <ListItemText
              primary={edition.title}
              secondary={[edition.publisher, edition.isbn13].filter(Boolean).join(' · ') || 'Sem editora informada'}
            />
          </ListItemButton>
        ))}
      </List>

      <EditEditionDialog edition={editing} onClose={() => setEditing(null)} />
    </Box>
  )
}
