import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { CollectionItemCard } from '../collection/CollectionItemCard'
import { OfflineNotice } from '../collection/OfflineNotice'
import { LazyScannerDialog } from '../scanner/LazyScannerDialog'
import { SearchField } from './CheckPage.styles'
import { NotOwnedResult } from './NotOwnedResult'
import { useCheck } from './useCheck'

export function CheckPage() {
  const [term, setTerm] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const { data, isFetching, isError, debouncedTerm } = useCheck(term)

  const hasSearched = debouncedTerm.length > 0
  const found = (data?.items.length ?? 0) > 0

  return (
    <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 5, md: 6 }, maxWidth: { md: 720 } }}>
      <Typography variant="h2">Eu tenho?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Digite um ISBN ou o título da edição.
      </Typography>

      <SearchField
        autoFocus
        fullWidth
        placeholder="978… ou título"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
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

      {isFetching && <LoadingSpinner size={24} sx={{ py: 2 }} />}

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
        <NotOwnedResult term={debouncedTerm} offline={data?.fromMirror ?? false} />
      )}
    </Box>
  )
}
