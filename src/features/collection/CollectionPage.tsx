import AddIcon from '@mui/icons-material/Add'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Alert, Box, CircularProgress, Fab, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollectionItemCard } from './CollectionItemCard'
import { OfflineNotice } from './OfflineNotice'
import { useCollection } from './useCollection'

export function CollectionPage() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useCollection(query)
  const items = data?.items
  const navigate = useNavigate()

  return (
    <Box sx={{ px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h2">Sua coleção</Typography>
        <Typography variant="caption" color="text.secondary">
          {items ? `${items.length} exemplar${items.length === 1 ? '' : 'es'}` : ' '}
        </Typography>
      </Stack>

      {data?.fromMirror && <OfflineNotice savedAt={data.savedAt} />}

      <TextField
        fullWidth
        placeholder="Buscar por título, editora ou ISBN"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ mb: 2.5, maxWidth: { md: 560 }, '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          },
        }}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {isError && <Alert severity="error">Não deu para carregar sua coleção agora.</Alert>}

      {items && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {query.trim() ? 'Nenhum exemplar encontrado.' : 'Sua coleção está vazia. Cadastre o primeiro exemplar.'}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(320px, 1fr))' } }}>
        {items?.map((item) => (
          <CollectionItemCard key={item.copy_id} item={item} showDelete={!data?.fromMirror} />
        ))}
      </Box>

      <Fab
        color="primary"
        aria-label="Cadastrar novo exemplar"
        onClick={() => navigate('/cadastro')}
        sx={{ display: { xs: 'flex', md: 'none' }, position: 'fixed', right: 20, bottom: 88 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}
