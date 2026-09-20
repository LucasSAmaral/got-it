import AddIcon from '@mui/icons-material/Add'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Alert, Box, CircularProgress, Fab, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollectionItemCard } from './CollectionItemCard'
import { useCollection } from './useCollection'

export function CollectionPage() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useCollection(query)
  const navigate = useNavigate()

  return (
    <Box sx={{ px: 2.5, py: 4 }}>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h2">Sua coleção</Typography>
        <Typography variant="caption" color="text.secondary">
          {data ? `${data.length} exemplar${data.length === 1 ? '' : 'es'}` : ' '}
        </Typography>
      </Stack>

      <TextField
        fullWidth
        placeholder="Buscar por título, editora ou ISBN"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
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

      {data && data.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {query.trim() ? 'Nenhum exemplar encontrado.' : 'Sua coleção está vazia. Cadastre o primeiro exemplar.'}
        </Typography>
      )}

      <Stack spacing={1.5}>
        {data?.map((item) => (
          <CollectionItemCard key={item.copy_id} item={item} showDelete />
        ))}
      </Stack>

      <Fab
        color="primary"
        aria-label="Cadastrar novo exemplar"
        onClick={() => navigate('/cadastro')}
        sx={{ position: 'fixed', right: 20, bottom: 88 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}
