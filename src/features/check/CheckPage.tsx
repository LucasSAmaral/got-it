import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CollectionItemCard } from '../collection/CollectionItemCard'
import { OfflineNotice } from '../collection/OfflineNotice'
import { LazyScannerDialog } from '../scanner/LazyScannerDialog'
import { useCheck } from './useCheck'

export function CheckPage() {
  const [term, setTerm] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const { data, isFetching, isError, debouncedTerm } = useCheck(term)
  const navigate = useNavigate()

  const hasSearched = debouncedTerm.length > 0
  const found = (data?.items.length ?? 0) > 0

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 5, md: 6 }, maxWidth: { md: 720 } }}>
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

      <Button
        fullWidth
        variant="outlined"
        color="inherit"
        startIcon={<PhotoCameraOutlinedIcon />}
        onClick={() => setScannerOpen(true)}
        sx={{ mb: 4, mt: -2, borderRadius: 999 }}
      >
        Escanear código de barras
      </Button>

      <LazyScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(scan) => {
          setTerm(scan.code)
          setScannerOpen(false)
        }}
      />

      {data?.fromMirror && <OfflineNotice savedAt={data.savedAt} />}

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
          {data.items.map((item) => (
            <CollectionItemCard key={item.copy_id} item={item} />
          ))}
        </Stack>
      )}

      {!isFetching && hasSearched && isError && (
        <Alert severity="error">Não deu para consultar agora. Tente de novo em instantes.</Alert>
      )}

      {!isFetching && hasSearched && !isError && !found && (
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
