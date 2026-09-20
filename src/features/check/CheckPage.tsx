import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollectionItemCard } from '../collection/CollectionItemCard'
import { useCheck } from './useCheck'

export function CheckPage() {
  const [term, setTerm] = useState('')
  const { data, isFetching, debouncedTerm } = useCheck(term)
  const navigate = useNavigate()

  const hasSearched = debouncedTerm.length > 0
  const found = (data?.length ?? 0) > 0

  return (
    <Box sx={{ px: 3, py: 5 }}>
      <Typography variant="h2">Eu tenho?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Digite um ISBN ou o título da edição.
      </Typography>

      <TextField
        autoFocus
        fullWidth
        placeholder="978… ou título"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': { borderRadius: 999, borderColor: 'primary.main' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: 2 },
        }}
      />

      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!isFetching && hasSearched && found && data && (
        <Stack spacing={1.5}>
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
            Você já tem
          </Typography>
          {data.map((item) => (
            <CollectionItemCard key={item.copy_id} item={item} />
          ))}
        </Stack>
      )}

      {!isFetching && hasSearched && !found && (
        <Stack
          spacing={1.5}
          sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2.5, border: 1, borderColor: 'divider', borderStyle: 'dashed' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }} color="text.secondary">
            Ainda não tem
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Não encontramos "{debouncedTerm}" na sua coleção.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(`/cadastro?isbn=${encodeURIComponent(debouncedTerm)}`)}
          >
            Cadastrar esta edição
          </Button>
        </Stack>
      )}
    </Box>
  )
}
