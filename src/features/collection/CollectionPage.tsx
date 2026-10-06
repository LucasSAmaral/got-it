import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditionGrid } from '../../components/EditionGrid'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SearchField } from '../../components/SearchField'
import { useShowMore } from '../../hooks/useShowMore'
import { LogoutDialog } from '../auth/LogoutDialog'
import { CollectionItemCard } from './CollectionItemCard'
import { AddFab } from './CollectionPage.styles'
import { OfflineNotice } from './OfflineNotice'
import { useCollection } from './useCollection'

export function CollectionPage() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useCollection(query)
  const items = data?.items
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { visibleCount, hasMore, sentinelRef } = useShowMore(items?.length ?? 0, query.trim())

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack direction="row" sx={{ mb: 2.5, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Stack spacing={0.5}>
          <Typography variant="h2">Sua coleção</Typography>
          <Typography variant="caption" color="text.secondary">
            {items ? `${items.length} exemplar${items.length === 1 ? '' : 'es'}` : ' '}
          </Typography>
        </Stack>
        {/* Celular: o Sair fica aqui, fora da navegação inferior, onde um toque sem querer é fácil. Na tela larga ele está na barra lateral. */}
        <IconButton
          aria-label="Sair"
          onClick={() => setLogoutOpen(true)}
          sx={{ display: { md: 'none' }, color: 'text.secondary' }}
        >
          <LogoutIcon />
        </IconButton>
      </Stack>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />

      {data?.fromMirror && <OfflineNotice savedAt={data.savedAt} />}

      <SearchField placeholder="Buscar por título, editora ou ISBN" value={query} onChange={setQuery} />

      {isLoading && <LoadingSpinner size={28} sx={{ py: 4 }} />}

      {isError && <Alert severity="error">Não deu para carregar sua coleção agora.</Alert>}

      {items && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {query.trim() ? 'Nenhum exemplar encontrado.' : 'Sua coleção está vazia. Cadastre o primeiro exemplar.'}
        </Typography>
      )}

      <EditionGrid>
        {items?.slice(0, visibleCount).map((item) => (
          <CollectionItemCard key={item.copy_id} item={item} showDelete={!data?.fromMirror} />
        ))}
      </EditionGrid>
      {hasMore && <Box ref={sentinelRef} />}

      <AddFab color="primary" aria-label="Cadastrar novo exemplar" onClick={() => navigate('/cadastro')}>
        <AddIcon />
      </AddFab>
    </Box>
  )
}
